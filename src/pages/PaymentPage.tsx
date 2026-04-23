import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { PhoneField } from "../components/PhoneField";
import { submitPaymentReceipt } from "../model/paymentModel";
import {
  paymentFormSchema,
  type PaymentFormValues,
} from "../validation/schemas";

const PERIOD_AMOUNT_MAP: Record<number, number> = {
  1: 300,
  3: 750,
  6: 1300,
};

export function PaymentPage() {
  const [error, setError] = React.useState<string | null>(null);
  const [successOpen, setSuccessOpen] = React.useState(false);
  const [paymentId, setPaymentId] = React.useState<string | undefined>();
  const [submitting, setSubmitting] = React.useState(false);
  const pasteAreaRef = React.useRef<HTMLDivElement | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      period: 1,
      phone: "",
    } as PaymentFormValues,
  });

  const period = Number(watch("period") ?? 1);
  const amount = PERIOD_AMOUNT_MAP[period] ?? 0;
  const receipt = watch("receipt");

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

  const onSubmit = handleSubmit(async (data) => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await submitPaymentReceipt(
        Number(data.period),
        PERIOD_AMOUNT_MAP[Number(data.period)],
        data.phone,
        data.receipt,
      );
      setPaymentId(res.paymentId);
      setSuccessOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось отправить данные");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Typography variant="h5" component="h1">
          Оплата ВПН по номеру телефона
        </Typography>

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Box component="form" onSubmit={onSubmit} noValidate>
          <Stack spacing={2}>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <PhoneField
                  label="Телефон"
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
                  Выбрать файл (PDF или фото)
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
              {submitting ? "Проверка и отправка…" : "Проверить и отправить"}
            </Button>
          </Stack>
        </Box>
      </Stack>

      <Dialog
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Оплата принята</DialogTitle>
        <DialogContent>
          <Typography>
            Квитанция успешно получена. После проверки доступ будет активирован.
          </Typography>
          {paymentId ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Номер заявки: {paymentId}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuccessOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
