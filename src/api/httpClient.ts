import { API_TOKEN } from '../config';

const API_BASE =
  process.env.NODE_ENV === 'development'
    ? ''
    : process.env.REACT_APP_API_BASE_URL ?? '';

export async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(API_TOKEN ? { 'x-api-token': API_TOKEN } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    if (!text) {
      throw new Error(`HTTP ${res.status}`);
    }

    let parsedMessage: string | null = null;
    try {
      const parsed = JSON.parse(text) as { message?: unknown };
      if (typeof parsed.message === 'string' && parsed.message.trim()) {
        parsedMessage = parsed.message;
      }
    } catch {
      // Not a JSON response; keep original text below.
    }

    if (parsedMessage) {
      throw new Error(parsedMessage);
    }

    throw new Error(text);
  }

  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return (await res.json()) as T;
  }
  return undefined as T;
}

export async function postFormData<T>(
  path: string,
  formData: FormData
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: API_TOKEN ? { 'x-api-token': API_TOKEN } : undefined,
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return (await res.json()) as T;
  }
  return undefined as T;
}
