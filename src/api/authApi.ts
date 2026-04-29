import { request } from './httpClient';

export type LoginResponse = { ok: boolean; message?: string; emailConfirmed?: boolean };
export type RegisterResponse = {
  _id: string;
  email: string;
  phone: string;
  createdAt?: string;
  updatedAt?: string;
};
export type ConfirmEmailResponse = { ok: boolean; message?: string };

export function loginApi(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function registerApi(
  email: string,
  phone: string,
  password: string,
  referralUserLogin?: string,
  chatId?: number
): Promise<RegisterResponse> {
  return request<RegisterResponse>('/api/users', {
    method: 'POST',
    body: JSON.stringify({
      email,
      phone,
      password,
      ...(referralUserLogin ? { referralUserLogin } : {}),
      ...(typeof chatId === 'number' ? { chatId } : {}),
    }),
  });
}

export function confirmEmailApi(token: string): Promise<ConfirmEmailResponse> {
  return request<ConfirmEmailResponse>('/api/auth/verify-email/confirm', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}
