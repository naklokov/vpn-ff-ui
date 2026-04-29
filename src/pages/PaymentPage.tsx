import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { PhoneField } from "../components/PhoneField";
import { PAYMENT_PHONE } from "../config";
import { submitPaymentReceipt } from "../model/paymentModel";
import { normalizeRuPhone } from "../model/phone";
import {
  paymentFormSchema,
  type PaymentFormValues,
} from "../validation/schemas";

const PERIOD_AMOUNT_MAP: Record<number, number> = {
  1: 300,
  3: 750,
  6: 1300,
};
type PendingPayment = {
  phone: string;
  period: number;
  amount: number;
  receipt: File;
};

export function PaymentPage() {
  const [searchParams] = useSearchParams();
  const phoneFromQuery = React.useMemo(() => {
    const raw = (searchParams.get("phone") ?? "").trim();
    if (!raw) {
      return "";
    }
    return normalizeRuPhone(raw);
  }, [searchParams]);

  const [error, setError] = React.useState<string | null>(null);
  const [successOpen, setSuccessOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingPayment, setPendingPayment] =
    React.useState<PendingPayment | null>(null);
  const [successPeriod, setSuccessPeriod] = React.useState<number | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const pasteAreaRef = React.useRef<HTMLDivElement | null>(null);

  const {
    control,
    handleSubmit,
    resetField,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      period: 1,
      phone: phoneFromQuery,
    } as PaymentFormValues,
  });

  const period = Number(watch("period") ?? 1);
  const amount = PERIOD_AMOUNT_MAP[period] ?? 0;
  const receipt = watch("receipt");

  React.useEffect(() => {
    if (phoneFromQuery) {
      setValue("phone", phoneFromQuery, { shouldValidate: true });
    }
  }, [phoneFromQuery, setValue]);

  React.useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items?.length) {
        return;
      }
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (
            file &&
            (file.type.startsWith("image/") || file.type === "application/pdf")
          ) {
            setValue("receipt", file, { shouldValidate: true });
            setError(null);
            break;
          }
        }
      }
    };
    const el = pasteAreaRef.current;
    if (!el) {
      return undefined;
    }
    el.addEventListener("paste", onPaste);
    return () => el.removeEventListener("paste", onPaste);
  }, [setValue]);

  const onFileChange = (file: File | undefined) => {
    if (!file) {
      return;
    }
    setValue("receipt", file, { shouldValidate: true });
    setError(null);
  };

  const copyPaymentPhone = async () => {
    try {
      if (!PAYMENT_PHONE) {
        throw new Error("Номер телефона для оплаты не установлен");
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(PAYMENT_PHONE);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = PAYMENT_PHONE;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        textarea.style.pointerEvents = "none";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const copied = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (!copied) {
          throw new Error("Не удалось скопировать номер. Скопируйте вручную.");
        }
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Не удалось скопировать номер. Скопируйте вручную.",
      );
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    setError(null);
    const paymentAmount = PERIOD_AMOUNT_MAP[Number(data.period)];
    setPendingPayment({
      phone: data.phone,
      period: Number(data.period),
      amount: paymentAmount,
      receipt: data.receipt,
    });
    setConfirmOpen(true);
  });

  const confirmPayment = async () => {
    if (!pendingPayment) {
      return;
    }
    const confirmedPayment = pendingPayment;
    setError(null);
    setSubmitting(true);
    setConfirmOpen(false);
    try {
      await submitPaymentReceipt(
        confirmedPayment.period,
        confirmedPayment.amount,
        confirmedPayment.phone,
        confirmedPayment.receipt,
      );
      resetField("phone", { defaultValue: "" });
      resetField("period", { defaultValue: 1 });
      resetField("receipt");
      setSuccessPeriod(confirmedPayment.period);
      setSuccessOpen(true);
      setPendingPayment(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось отправить данные");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Typography variant="h5" component="h1">
          Оплата подписки ВПН
        </Typography>

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Box component="form" onSubmit={onSubmit} noValidate>
          <Stack spacing={2}>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <PhoneField
                  label="Телефон для оплаты"
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  error={Boolean(errors.phone)}
                  helperText={errors.phone?.message}
                  autoComplete="tel"
                />
              )}
            />

            <Controller
              name="period"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Период оплаты"
                  error={Boolean(errors.period)}
                  helperText={errors.period?.message}
                  fullWidth
                >
                  <MenuItem value={1}>1 месяц</MenuItem>
                  <MenuItem value={3}>3 месяца</MenuItem>
                  <MenuItem value={6}>6 месяцев</MenuItem>
                </TextField>
              )}
            />

            <TextField
              label="Сумма к оплате"
              value={amount ? `${amount} ₽` : "—"}
              InputProps={{ readOnly: true }}
              fullWidth
            />

            <Alert severity="warning" icon={false}>
              <Stack spacing={1}>
                <Typography variant="body2">
                  Оплату можно произвести переводом на карту по номеру телефона
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  Перевод ТОЛЬКО на OZON банк
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  В случае перевода на другой банк, платёж проведён НЕ БУДЕТ
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  После оплаты ОБЯЗАТЕЛЬНО приложите чек в PDF формате в поле
                  ниже, иначе платёж проведён НЕ БУДЕТ
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={copyPaymentPhone}
                >
                  {copied
                    ? "Номер скопирован"
                    : "Скопировать номер телефона для перевода"}
                </Button>
              </Stack>
            </Alert>

            <Box
              ref={pasteAreaRef}
              tabIndex={0}
              sx={{
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: 1,
                p: 2,
                outline: "none",
                "&:focus-visible": { borderColor: "primary.main" },
              }}
            >
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  Приложите квитанцию или скриншот об оплате
                </Typography>
                <Button variant="outlined" component="label">
                  Выбрать чек
                  <input
                    type="file"
                    hidden
                    accept="application/pdf,image/*"
                    onChange={(e) => onFileChange(e.target.files?.[0])}
                  />
                </Button>
                <Typography variant="body2" color="text.secondary">
                  {receipt instanceof File
                    ? `${receipt.name} (${Math.round(receipt.size / 1024)} КБ)`
                    : "Файл не выбран"}
                </Typography>
                {errors.receipt ? (
                  <Typography variant="caption" color="error">
                    {errors.receipt.message as string}
                  </Typography>
                ) : null}
              </Stack>
            </Box>

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting}
            >
              {submitting ? "Проверка и отправка…" : "Оплатить"}
            </Button>
          </Stack>
        </Box>
      </Stack>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Подтверждение оплаты</DialogTitle>
        <DialogContent>
          <Typography>
            Вы хотите провести оплату за номер{" "}
            <strong>{pendingPayment?.phone ?? "—"}</strong> за период{" "}
            <strong>{pendingPayment?.period ?? "—"} мес.</strong> на сумму{" "}
            <strong>{pendingPayment?.amount ?? "—"} ₽</strong>.
          </Typography>
          <Typography sx={{ mt: 1 }}>Подтверждаете?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={submitting}>
            Отмена
          </Button>
          <Button
            onClick={confirmPayment}
            variant="contained"
            disabled={submitting}
          >
            Подтверждаю
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Ваша оплата успешно принята</DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            <Typography>
              Доступ продлён на {successPeriod ?? period} мес.
            </Typography>
            <Typography>
              Обновите подписку в приложении в котором вы используете VPN
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Если у вас есть проблемы, обратитесь в{" "}
              <Link component={RouterLink} to="/support">
                поддержку
              </Link>
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuccessOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
