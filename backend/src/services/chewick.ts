import { chewickConfig } from '../config/payment';

// Chewick merchant gateway client (Pay-by-Link flow).
//
// Spec notes that shape this file:
//  - Every amount is in qəpik (1/100 AZN) as a whole number: 4200 === 42.00 AZN.
//  - Auth is a JWT from POST /v1/merchant/login, sent as `X-Access-Token: Bearer <jwt>`.
//  - /v1/payment/links has NO callbackUrl field — the callback/redirect URLs are
//    registered with Chewick out-of-band, and the spec tells integrators to poll
//    GET /v1/payment/transactions/{id}/status. Polling is therefore our source of
//    truth; see services/chewickReconcile.ts.

const REQUEST_TIMEOUT_MS = 15_000;

// PENDING is absent from the integration PDF but is sent in practice —
// confirmed against Chewick's own callback status list.
export type ChewickTransactionStatus =
  | 'CREATED'
  | 'PENDING'
  | 'COMPLETED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'FAILED'
  | 'REVERSED';

interface ChewickEnvelope<T> {
  status?: string;
  data?: T;
  message?: string;
}

export interface ChewickLineItem {
  name: string;
  /** Unit price in qəpik, >= 1. */
  amount: number;
  quantity: number;
  imageUrl?: string;
}

export interface CreatePaymentLinkOptions {
  /** Shown to the customer in the Chewick app; we put the order code here so the link is traceable. */
  name: string;
  items: ChewickLineItem[];
}

export interface ChewickPaymentLink {
  id: string;
  name: string;
  linkType: string;
  status: string;
  totalAmount: number;
  paymentUrl: string;
  qrString?: string;
  paymentCode?: string;
  validTo?: string;
}

export interface ChewickTransaction {
  transactionId: string;
  status: ChewickTransactionStatus;
  description?: string;
}

export class ChewickError extends Error {
  constructor(message: string, readonly httpStatus?: number) {
    super(message);
    this.name = 'ChewickError';
  }
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

let cachedToken: { value: string; expiresAt: number } | null = null;
/** Dedupes concurrent logins so a burst of orders doesn't open a session each. */
let loginInFlight: Promise<string> | null = null;

/** Reads `exp` out of the JWT so we refresh just before Chewick expires it. */
function tokenLifetimeMs(jwt: string): number {
  const DEFAULT = 45 * 60 * 1000;
  try {
    const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString('utf8')) as { exp?: number };
    if (!payload.exp) return DEFAULT;
    // Refresh a minute early to avoid racing the expiry.
    const remaining = payload.exp * 1000 - Date.now() - 60_000;
    return remaining > 0 ? remaining : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

async function login(): Promise<string> {
  const cfg = chewickConfig();

  const res = await fetch(`${cfg.baseUrl}/v1/merchant/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: cfg.username, password: cfg.password }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const json = (await safeJson(res)) as ChewickEnvelope<string>;

  if (!res.ok || typeof json?.data !== 'string' || !json.data) {
    throw new ChewickError(
      `Chewick login failed (HTTP ${res.status}): ${json?.message ?? 'no token in response'}`,
      res.status
    );
  }

  return json.data;
}

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;

  if (!loginInFlight) {
    loginInFlight = login()
      .then((token) => {
        cachedToken = { value: token, expiresAt: Date.now() + tokenLifetimeMs(token) };
        return token;
      })
      .finally(() => {
        loginInFlight = null;
      });
  }

  return loginInFlight;
}

/** Drops the cached session; the next call logs in again. */
export function invalidateChewickSession(): void {
  cachedToken = null;
}

/** Best-effort session teardown — used on graceful shutdown. */
export async function chewickLogout(): Promise<void> {
  if (!cachedToken) return;
  const cfg = chewickConfig();
  const token = cachedToken.value;
  cachedToken = null;

  try {
    await fetch(`${cfg.baseUrl}/v1/merchant/logout`, {
      method: 'POST',
      headers: { 'X-Access-Token': `Bearer ${token}` },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    console.warn('Chewick logout failed (ignored):', (err as Error).message);
  }
}

// ---------------------------------------------------------------------------
// Authenticated requests
// ---------------------------------------------------------------------------

async function safeJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 300) };
  }
}

async function authed<T>(path: string, init: RequestInit, retryOn401 = true): Promise<T> {
  const cfg = chewickConfig();
  const token = await getToken();

  const res = await fetch(`${cfg.baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
      'X-Access-Token': `Bearer ${token}`,
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  // An expired or server-side-revoked session: log in once more, then give up.
  if ((res.status === 401 || res.status === 403) && retryOn401) {
    invalidateChewickSession();
    return authed<T>(path, init, false);
  }

  const json = (await safeJson(res)) as ChewickEnvelope<T> | T;

  if (!res.ok) {
    const message = (json as ChewickEnvelope<T>)?.message ?? `HTTP ${res.status}`;
    throw new ChewickError(`Chewick ${path} failed: ${message}`, res.status);
  }

  // The gateway wraps some responses in { status, data } and returns others flat.
  const envelope = json as ChewickEnvelope<T>;
  return (envelope && typeof envelope === 'object' && 'data' in envelope ? envelope.data : json) as T;
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

/** yyyy-MM-dd, `days` from now — Chewick's validTo is date-only. */
function validToDate(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function createChewickPaymentLink(
  opts: CreatePaymentLinkOptions
): Promise<ChewickPaymentLink> {
  const cfg = chewickConfig();

  const link = await authed<ChewickPaymentLink>('/v1/payment/links', {
    method: 'POST',
    body: JSON.stringify({
      name: opts.name,
      // One link per order, single use.
      linkType: 'DYNAMIC',
      transactionCountLimit: 1,
      validTo: validToDate(cfg.linkValidDays),
      items: opts.items,
    }),
  });

  if (!link?.paymentUrl || !link?.id) {
    throw new ChewickError('Chewick returned a payment link without id/paymentUrl');
  }

  return link;
}

export async function getChewickTransactionStatus(id: string): Promise<ChewickTransaction> {
  const tx = await authed<ChewickTransaction>(
    `/v1/payment/transactions/${encodeURIComponent(id)}/status`,
    { method: 'GET' }
  );

  if (!tx?.status) {
    throw new ChewickError(`Chewick status response for ${id} has no status field`);
  }

  return tx;
}

// ---------------------------------------------------------------------------
// Money helpers
// ---------------------------------------------------------------------------

/** AZN (float, as stored in Postgres) → qəpik (integer, as Chewick expects). */
export function toQapik(azn: number): number {
  return Math.round(azn * 100);
}

/** qəpik → AZN, for comparing Chewick totals against our order total. */
export function fromQapik(qapik: number): number {
  return parseFloat((qapik / 100).toFixed(2));
}
