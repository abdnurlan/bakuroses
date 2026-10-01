// Payment provider selection.
//
// Which gateway runs is decided by env vars only — no code change is needed to
// promote Chewick from UAT to production:
//
//   PAYMENT_PROVIDER=payriff            → live Payriff (current production)
//   PAYMENT_PROVIDER=chewick            → Chewick, environment picked by CHEWICK_ENV
//   CHEWICK_ENV=uat | prod              → which Chewick gateway host to talk to
//
// Keep production .env on `payriff` and the dev/staging .env on
// `chewick` + `uat` until Chewick is signed off.

export type PaymentProvider = 'payriff' | 'chewick';
export type ChewickEnv = 'uat' | 'prod';

/** Providers that redirect the customer to an external gateway before we see money. */
export const ONLINE_PROVIDERS: readonly PaymentProvider[] = ['payriff', 'chewick'];

const CHEWICK_BASE_URLS: Record<ChewickEnv, string> = {
  uat: 'https://merchant-gw.uat.chewick.com',
  prod: 'https://merchant-gw.chewick.com',
};

export interface ChewickConfig {
  env: ChewickEnv;
  baseUrl: string;
  username: string;
  password: string;
  /** How many days a generated payment link stays valid. Chewick's validTo is date-only. */
  linkValidDays: number;
  /** Seconds between background status polls for unconfirmed orders. */
  pollIntervalSeconds: number;
  /** Stop polling an order older than this. */
  pollMaxAgeMinutes: number;
}

export function activeProvider(): PaymentProvider {
  const raw = (process.env.PAYMENT_PROVIDER ?? 'payriff').trim().toLowerCase();
  if (raw !== 'payriff' && raw !== 'chewick') {
    throw new Error(`Invalid PAYMENT_PROVIDER="${raw}" (expected "payriff" or "chewick")`);
  }
  return raw;
}

export function chewickConfig(): ChewickConfig {
  const env = (process.env.CHEWICK_ENV ?? 'uat').trim().toLowerCase();
  if (env !== 'uat' && env !== 'prod') {
    throw new Error(`Invalid CHEWICK_ENV="${env}" (expected "uat" or "prod")`);
  }

  const username = process.env.CHEWICK_USERNAME ?? '';
  const password = process.env.CHEWICK_PASSWORD ?? '';
  if (!username || !password) {
    throw new Error('CHEWICK_USERNAME and CHEWICK_PASSWORD are required when PAYMENT_PROVIDER=chewick');
  }

  return {
    env,
    baseUrl: (process.env.CHEWICK_BASE_URL ?? CHEWICK_BASE_URLS[env]).replace(/\/+$/, ''),
    username,
    password,
    linkValidDays: positiveInt(process.env.CHEWICK_LINK_VALID_DAYS, 1),
    pollIntervalSeconds: positiveInt(process.env.CHEWICK_POLL_INTERVAL_SECONDS, 30),
    pollMaxAgeMinutes: positiveInt(process.env.CHEWICK_POLL_MAX_AGE_MINUTES, 180),
  };
}

function positiveInt(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/**
 * Fail fast at boot rather than at the first checkout: a missing key should
 * break the deploy, not the customer's order.
 */
export function assertPaymentConfig(): void {
  const provider = activeProvider();

  if (provider === 'payriff' && !process.env.PAYRIFF_SECRET_KEY) {
    throw new Error('PAYRIFF_SECRET_KEY is required when PAYMENT_PROVIDER=payriff');
  }

  if (provider === 'chewick') {
    const cfg = chewickConfig();
    console.log(`💳 Payment provider: chewick (${cfg.env}) → ${cfg.baseUrl}`);
    if (cfg.env === 'uat') {
      console.log('   ⚠️  Chewick UAT — no real money moves through this environment.');
    }
    return;
  }

  console.log('💳 Payment provider: payriff');
}
