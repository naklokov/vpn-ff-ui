import { request } from './httpClient';

export type CheckPaymentResponse = {
  isPayCorrect: boolean;
};

export type CreatePaymentPayload = {
  chatId?: number;
  period: number;
  amount: number;
  phone: string;
  date: string;
};

export type CreatePaymentResponse = {
  _id: string;
  chatId?: number;
  period: number;
  amount: number;
  phone: string;
  date: string;
};

export function checkPaymentApi(
  amount: number,
  fileBase64: string,
  mimeType?: string
): Promise<CheckPaymentResponse> {
  return request<CheckPaymentResponse>('/api/payments/check-payment', {
    method: 'POST',
    body: JSON.stringify({ amount, fileBase64, mimeType }),
  });
}

export function createPaymentApi(
  payload: CreatePaymentPayload
): Promise<CreatePaymentResponse> {
  return request<CreatePaymentResponse>('/api/payments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
