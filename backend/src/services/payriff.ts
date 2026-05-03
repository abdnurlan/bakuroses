import type { Order } from '@prisma/client';

interface PayriffCreateOrderOptions {
  internalOrderId: string;
  amount: number;
  currency: string;
  description: string;
  callbackUrl: string;
  approveUrl: string;
  cancelUrl: string;
  declineUrl: string;
  language?: string;
}

interface PayriffOrderPayload {
  orderId: string;
  paymentUrl: string;
  transactionId: number;
}

interface PayriffResponse {
  code: string;
  message: string;
  payload: PayriffOrderPayload;
}

export interface PayriffCallbackPayload {
  orderId: string;
  amount: number;
  currencyType: string;
  paymentStatus: string;
  operationType: string;
  transactions: {
    uuid: string;
    status: string;
    channel: string;
    requestRrn: string;
    pan?: string;
  }[];
}

const BASE_URL = 'https://api.payriff.com/api/v3';

export async function createPayriffOrder(opts: PayriffCreateOrderOptions): Promise<{
  payriffOrderId: string;
  paymentUrl: string;
}> {
  const secretKey = process.env.PAYRIFF_SECRET_KEY!;

  const res = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Authorization': secretKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: opts.amount,
      currency: opts.currency,
      language: opts.language ?? 'AZ',
      description: opts.description,
      callbackUrl: opts.callbackUrl,
      approveUrl: opts.approveUrl,
      cancelUrl: opts.cancelUrl,
      declineUrl: opts.declineUrl,
      operation: 'PURCHASE',
      metadata: {
        internalOrderId: opts.internalOrderId,
      },
    }),
  });

  const json = (await res.json()) as PayriffResponse;

  if (json.code !== '00000' || !json.payload?.paymentUrl) {
    throw new Error(`Payriff error: ${json.code} — ${json.message}`);
  }

  return {
    payriffOrderId: json.payload.orderId,
    paymentUrl: json.payload.paymentUrl,
  };
}

export async function getPayriffOrderStatus(payriffOrderId: string): Promise<PayriffCallbackPayload> {
  const secretKey = process.env.PAYRIFF_SECRET_KEY!;

  const res = await fetch(`${BASE_URL}/orders/${payriffOrderId}`, {
    headers: { 'Authorization': secretKey },
  });

  const json = (await res.json()) as { code: string; payload: PayriffCallbackPayload };

  if (json.code !== '00000') {
    throw new Error(`Payriff status check error: ${json.code}`);
  }

  return json.payload;
}
