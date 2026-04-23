import { checkPaymentApi, createPaymentApi } from "../api/paymentApi";
import { MOCK_API } from "../config";
import { normalizeRuPhone } from "./phone";

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_BYTES = 15 * 1024 * 1024;

export function validateReceiptFile(file: File): string | null {
  if (file.size > MAX_BYTES) {
    return "Файл не должен превышать 15 МБ";
  }
  if (file.type && !ALLOWED_MIME.has(file.type)) {
    return "Допустимы PDF или изображения (JPEG, PNG, WebP, GIF)";
  }
  const lower = file.name.toLowerCase();
  if (
    !lower.endsWith(".pdf") &&
    !lower.endsWith(".jpg") &&
    !lower.endsWith(".jpeg") &&
    !lower.endsWith(".png") &&
    !lower.endsWith(".webp") &&
    !lower.endsWith(".gif")
  ) {
    return "Неверное расширение файла";
  }
  return null;
}

export async function submitPaymentReceipt(
  period: number,
  amount: number,
  phone: string,
  receipt: File,
): Promise<{ paymentId?: string }> {
  const err = validateReceiptFile(receipt);
  if (err) {
    throw new Error(err);
  }
  const normalized = normalizeRuPhone(phone);
  const formData = new FormData();
  formData.append("phone", normalized);
  formData.append("receipt", receipt);

  if (MOCK_API) {
    await delay(600);
    return { paymentId: "mock-payment-id" };
  }

  const fileBase64 = await fileToBase64(receipt);
  const check = await checkPaymentApi(
    amount,
    fileBase64,
    receipt.type || undefined,
  );
  if (!check.isPayCorrect) {
    throw new Error("Сумма в квитанции не совпадает с указанной");
  }

  const created = await createPaymentApi({
    period,
    amount,
    phone: normalized,
    date: new Date().toISOString(),
  });

  return { paymentId: created._id };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Не удалось прочитать файл"));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.readAsDataURL(file);
  });
}
