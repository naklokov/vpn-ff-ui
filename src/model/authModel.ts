import { confirmEmailApi, loginApi, registerApi } from "../api/authApi";
import { normalizeRuPhone } from "./phone";

type StoredAuthState = {
  isLoggedIn: boolean;
  email?: string;
};

const KEY_AUTH_EMAIL = "auth.email";
const KEY_SESSION = "auth.session";
const KEY_SAVED_CREDENTIALS = "auth.savedCredentials";

function readBool(key: string): boolean {
  return localStorage.getItem(key) === "true";
}

function readString(key: string): string | undefined {
  const v = localStorage.getItem(key);
  return v ? v : undefined;
}

export function getAuthStatus(): StoredAuthState {
  return {
    isLoggedIn: readBool(KEY_SESSION),
    email: readString(KEY_AUTH_EMAIL),
  };
}

export function saveCredentials(email: string, password: string): void {
  localStorage.setItem(
    KEY_SAVED_CREDENTIALS,
    JSON.stringify({ email, password }),
  );
}

export function clearSavedCredentials(): void {
  localStorage.removeItem(KEY_SAVED_CREDENTIALS);
}

export function getSavedCredentials():
  | { email: string; password: string }
  | undefined {
  const raw = readString(KEY_SAVED_CREDENTIALS);
  if (!raw) {
    return undefined;
  }
  try {
    return JSON.parse(raw) as { email: string; password: string };
  } catch {
    return undefined;
  }
}

export function logout(): void {
  localStorage.setItem(KEY_SESSION, "false");
  localStorage.removeItem(KEY_AUTH_EMAIL);
}

export async function registerUser(
  email: string,
  phone: string,
  password: string,
  referralUserLogin?: string,
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = normalizeRuPhone(phone);
  const referralDigits = (referralUserLogin ?? "").replace(/\D/g, "");
  const normalizedReferralUserLogin =
    referralDigits.length > 1
      ? normalizeRuPhone(referralUserLogin ?? "")
      : undefined;

  await registerApi(
    normalizedEmail,
    normalizedPhone,
    password,
    normalizedReferralUserLogin,
  );
}

export async function loginUser(
  email: string,
  password: string,
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  const res = await loginApi(normalizedEmail, password);
  if (!res.ok) {
    throw new Error(res.message ?? "Ошибка входа");
  }
  if (!res.emailConfirmed) {
    throw new Error("EMAIL_NOT_CONFIRMED");
  }

  localStorage.setItem(KEY_SESSION, "true");
  localStorage.setItem(KEY_AUTH_EMAIL, normalizedEmail);
}

export async function verifyEmailByToken(token: string): Promise<void> {
  const trimmed = token.trim();
  if (!trimmed) {
    throw new Error("Некорректная ссылка подтверждения");
  }

  const res = await confirmEmailApi(trimmed);
  if (!res.ok) {
    throw new Error(res.message ?? "Не удалось подтвердить email");
  }
}

export function isLoggedIn(): boolean {
  return readBool(KEY_SESSION);
}
