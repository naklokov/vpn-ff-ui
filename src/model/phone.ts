/** Нормализует отображаемый номер к виду +7XXXXXXXXXX (11 цифр после +) */
export function normalizeRuPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('8') && digits.length >= 11) {
    return `+7${digits.slice(1, 11)}`;
  }
  if (digits.startsWith('7') && digits.length >= 11) {
    return `+7${digits.slice(1, 11)}`;
  }
  if (digits.length === 10) {
    return `+7${digits}`;
  }
  return raw.startsWith('+') ? raw : `+${digits}`;
}

export function isValidRuMobile(phone: string): boolean {
  const n = normalizeRuPhone(phone);
  return /^\+7\d{10}$/.test(n);
}
