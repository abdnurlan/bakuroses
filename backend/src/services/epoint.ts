import crypto from 'crypto';

interface EpointPaymentOptions {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  successRedirectUrl: string;
  failRedirectUrl: string;
}

interface EpointResponse {
  status: string;
  transaction: string;
  redirect_url: string;
}

function buildSignature(privateKey: string, data: string): string {
  // Epoint spec: base64( sha1( privateKey + data + privateKey, raw ) )
  return crypto
    .createHash('sha1')
    .update(privateKey + data + privateKey, 'binary')
    .digest('base64');
}

export async function createEpointPayment(
  opts: EpointPaymentOptions
): Promise<EpointResponse> {
  const publicKey = process.env.EPOINT_PUBLIC_KEY!;
  const privateKey = process.env.EPOINT_PRIVATE_KEY!;

  const payload = {
    public_key: publicKey,
    amount: opts.amount,
    currency: opts.currency,
    order_id: opts.orderId,
    description: opts.description,
    language: 'az',
    success_redirect_url: opts.successRedirectUrl,
    error_redirect_url: opts.failRedirectUrl,
  };

  const data = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = buildSignature(privateKey, data);

  const body = new URLSearchParams({ data, signature });

  const res = await fetch('https://epoint.az/api/1/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  return res.json() as Promise<EpointResponse>;
}

export function verifyEpointSignature(data: string, signature: string): boolean {
  const privateKey = process.env.EPOINT_PRIVATE_KEY!;
  const expected = buildSignature(privateKey, data);
  return expected === signature;
}
