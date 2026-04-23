import { confirmEmailApi, loginApi, registerApi } from "../api/authApi";
import { MOCK_API } from "../config";
import { normalizeRuPhone } from "./phone";

type StoredAuthState = {
  isLoggedIn: boolean;
  email?: string;
};

type MockUser = {
  email: string;
  phone: string;
  password: string;
  emailConfirmed: boolean;
  verifyToken: string;
};

const KEY_AUTH_EMAIL = "auth.email";
const KEY_SESSION = "auth.session";
const KEY_SAVED_CREDENTIALS = "auth.savedCredentials";
const KEY_MOCK_USERS = "auth.mock.users";

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

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

function readMockUsers(): MockUser[] {
  const raw = readString(KEY_MOCK_USERS);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as MockUser[];
  } catch {
    return [];
  }
}

function writeMockUsers(users: MockUser[]): void {
  localStorage.setItem(KEY_MOCK_USERS, JSON.stringify(users));
}

export async function registerUser(
  email: string,
  phone: string,
  password: string,
  referralUserLogin?: string,
): Promise<{ verifyToken?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = normalizeRuPhone(phone);
  const normalizedReferralUserLogin =
    referralUserLogin && referralUserLogin.trim()
      ? normalizeRuPhone(referralUserLogin)
      : undefined;

  if (MOCK_API) {
    await delay(450);
    const users = readMockUsers();
    const exists = users.some((u) => u.email === normalizedEmail);
    if (exists) {
      throw new Error("Пользователь с таким email уже существует");
    }
    const verifyToken = `mock-token-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    users.push({
      email: normalizedEmail,
      phone: normalizedPhone,
      password,
      emailConfirmed: false,
      verifyToken,
    });
    writeMockUsers(users);
    return { verifyToken };
  }

  await registerApi(
    normalizedEmail,
    normalizedPhone,
    password,
    normalizedReferralUserLogin,
  );
  return {};
}

export async function loginUser(
  email: string,
  password: string,
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  if (MOCK_API) {
    await delay(300);
    const user = readMockUsers().find((u) => u.email === normalizedEmail);
    if (!user || user.password !== password) {
      throw new Error("Неверный email или пароль");
    }
    if (!user.emailConfirmed) {
      throw new Error("EMAIL_NOT_CONFIRMED");
    }
    localStorage.setItem(KEY_SESSION, "true");
    localStorage.setItem(KEY_AUTH_EMAIL, user.email);
    return;
  }

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

  if (MOCK_API) {
    await delay(350);
    const users = readMockUsers();
    const idx = users.findIndex((u) => u.verifyToken === trimmed);
    if (idx === -1) {
      throw new Error("Некорректная ссылка подтверждения");
    }
    users[idx] = { ...users[idx], emailConfirmed: true };
    writeMockUsers(users);
    return;
  }

  const res = await confirmEmailApi(trimmed);
  if (!res.ok) {
    throw new Error(res.message ?? "Не удалось подтвердить email");
  }
}

export function isLoggedIn(): boolean {
  return readBool(KEY_SESSION);
}
