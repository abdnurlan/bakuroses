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

export async function createEpointPayment(
  opts: EpointPaymentOptions
): Promise<EpointResponse> {
  const publicKey = process.env.EPOINT_PUBLIC_KEY!;
  const privateKey = process.env.EPOINT_PRIVATE_KEY!;

  const data = {
    amount: opts.amount,
    currency: opts.currency,
    order_id: opts.orderId,
    description: opts.description,
    successRedirectUrl: opts.successRedirectUrl,
    failRedirectUrl: opts.failRedirectUrl,
  };

  const jsonData = Buffer.from(JSON.stringify(data)).toString('base64');
  const signature = crypto
    .createHmac('sha1', privateKey)
    .update(jsonData)
    .digest('base64');

  const res = await fetch('https://epoint.az/api/1/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: jsonData, signature, publicKey }),
  });

  return res.json() as Promise<EpointResponse>;
}

export function verifyEpointSignature(data: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha1', process.env.EPOINT_PRIVATE_KEY!)
    .update(data)
    .digest('base64');
  return expected === signature;
}
