import * as React from "react";
import { Controller, useForm } from "react-hook-form";
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
import ButtonBase from "@mui/material/ButtonBase";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import IconButton from "@mui/material/IconButton";
import { PhoneField } from "../components/PhoneField";
import { PAYMENT_PHONE } from "../config";
import {
  PAYMENT_PERIOD_OPTIONS,
  PAYMENT_PERIOD_QUERY,
  PAYMENT_STEP_QUERY,
  PERIOD_AMOUNT_MAP,
  parsePaymentPeriod,
  parsePaymentStep,
  periodLabel,
  usePaymentFlow,
  type PaymentStep,
} from "../model/paymentFlow";
import { submitPaymentReceipt } from "../model/paymentModel";
import { normalizeRuPhone } from "../model/phone";
import {
  paymentPeriodStepSchema,
  paymentReceiptStepSchema,
  type PaymentPeriodStepValues,
} from "../validation/schemas";

type PeriodFormValues = PaymentPeriodStepValues & {
  receipt?: File;
};

type PendingPayment = {
  phone: string;
  period: number;
  amount: number;
  receipt: File;
};

const STEP_LABELS = ["Период", "Перевод", "Квитанция"];

export function PaymentPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { setIncomplete, setLastPaymentTo } = usePaymentFlow();

  const step = parsePaymentStep(searchParams.get(PAYMENT_STEP_QUERY));
  const periodFromQuery = parsePaymentPeriod(
    searchParams.get(PAYMENT_PERIOD_QUERY),
  );
  const phoneFromQuery = React.useMemo(() => {
    const raw = (searchParams.get("phone") ?? "").trim();
    if (!raw) {
      return "";
    }
    return normalizeRuPhone(raw);
  }, [searchParams]);

  const [error, setError] = React.useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingPayment, setPendingPayment] =
    React.useState<PendingPayment | null>(null);
  const [successPeriod, setSuccessPeriod] = React.useState<number | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [migrationInfo, setMigrationInfo] = React.useState<{
    isMigratedToRemnawave: boolean;
    subscriptionUrl?: string | null;
  } | null>(null);
  const pasteAreaRef = React.useRef<HTMLDivElement | null>(null);

  const {
    control,
    trigger,
    resetField,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<PeriodFormValues>({
    resolver: zodResolver(paymentPeriodStepSchema),
    defaultValues: {
      period: periodFromQuery,
      phone: phoneFromQuery,
    },
  });

  const period = Number(watch("period") ?? periodFromQuery);
  const amount = PERIOD_AMOUNT_MAP[period] ?? 0;
  const receipt = watch("receipt");
  const isDone = step === "done" && successPeriod != null;
  const visibleStep: PaymentStep = isDone ? "done" : step === "done" ? 1 : step;
  const activeStepIndex = isDone ? 3 : Number(visibleStep) - 1;

  React.useEffect(() => {
    const next = new URLSearchParams(searchParams);
    let changed = false;
    if (!next.get(PAYMENT_STEP_QUERY)) {
      next.set(PAYMENT_STEP_QUERY, "1");
      changed = true;
    }
    if (!next.get(PAYMENT_PERIOD_QUERY)) {
      next.set(PAYMENT_PERIOD_QUERY, String(periodFromQuery));
      changed = true;
    }
    if (changed) {
      setSearchParams(next, { replace: true });
    }
  }, [periodFromQuery, searchParams, setSearchParams]);

  React.useEffect(() => {
    if (step === "done" && successPeriod == null) {
      const next = new URLSearchParams(searchParams);
      next.set(PAYMENT_STEP_QUERY, "1");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, step, successPeriod]);

  React.useEffect(() => {
    if (isDone) {
      setIncomplete(false);
      return;
    }
    if (visibleStep === 2 || visibleStep === 3) {
      setIncomplete(true);
      setLastPaymentTo(`/payment?${searchParams.toString()}`);
    }
  }, [isDone, searchParams, setIncomplete, setLastPaymentTo, visibleStep]);

  React.useEffect(() => {
    if (phoneFromQuery) {
      setValue("phone", phoneFromQuery, { shouldValidate: true });
    }
  }, [phoneFromQuery, setValue]);

  React.useEffect(() => {
    setValue("period", periodFromQuery, { shouldValidate: false });
  }, [periodFromQuery, setValue]);

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
  }, [setValue, step]);

  const goToStep = React.useCallback(
    (nextStep: PaymentStep, nextPeriod = period) => {
      const next = new URLSearchParams(searchParams);
      next.set(PAYMENT_STEP_QUERY, String(nextStep));
      next.set(PAYMENT_PERIOD_QUERY, String(nextPeriod));
      const phone = getValues("phone");
      if (phone) {
        next.set("phone", normalizeRuPhone(phone));
      }
      if (nextStep === 2 || nextStep === 3) {
        setLastPaymentTo(`/payment?${next.toString()}`);
      }
      setSearchParams(next);
      setError(null);
    },
    [getValues, period, searchParams, setLastPaymentTo, setSearchParams],
  );

  const onFileChange = (file: File | undefined) => {
    if (!file) {
      return;
    }
    setValue("receipt", file, { shouldValidate: true });
    setError(null);
  };

  const clearReceipt = () => {
    setValue("receipt", undefined, { shouldValidate: true });
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
        const copiedOk = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (!copiedOk) {
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

  const goToTransfer = async () => {
    const valid = await trigger(["phone", "period"]);
    if (!valid) {
      return;
    }
    goToStep(2, Number(getValues("period")));
  };

  const goToReceipt = () => {
    goToStep(3);
  };

  const openConfirm = () => {
    const parsed = paymentReceiptStepSchema.safeParse({
      receipt: getValues("receipt"),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Прикрепите квитанцию");
      return;
    }
    const values = getValues();
    const paymentAmount = PERIOD_AMOUNT_MAP[Number(values.period)];
    setPendingPayment({
      phone: values.phone,
      period: Number(values.period),
      amount: paymentAmount,
      receipt: parsed.data.receipt,
    });
    setConfirmOpen(true);
  };

  const confirmPayment = async () => {
    if (!pendingPayment) {
      return;
    }
    const confirmedPayment = pendingPayment;
    setError(null);
    setSubmitting(true);
    setConfirmOpen(false);
    try {
      const result = await submitPaymentReceipt(
        confirmedPayment.period,
        confirmedPayment.amount,
        confirmedPayment.phone,
        confirmedPayment.receipt,
      );
      resetField("phone", { defaultValue: "" });
      resetField("period", { defaultValue: 1 });
      resetField("receipt");
      setSuccessPeriod(confirmedPayment.period);
      setMigrationInfo(
        result.isMigratedToRemnawave
          ? {
              isMigratedToRemnawave: true,
              subscriptionUrl: result.subscriptionUrl,
            }
          : null,
      );
      setPendingPayment(null);
      setIncomplete(false);
      goToStep("done", confirmedPayment.period);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось отправить данные");
    } finally {
      setSubmitting(false);
    }
  };

  const restartPayment = () => {
    setSuccessPeriod(null);
    setMigrationInfo(null);
    goToStep(1, 1);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Typography variant="h5" component="h1">
          Оплата подписки ВПН
        </Typography>

        <Stepper activeStep={activeStepIndex} alternativeLabel>
          {STEP_LABELS.map((label, index) => (
            <Step
              key={label}
              completed={isDone || index < activeStepIndex}
              sx={{
                cursor:
                  !isDone && index < activeStepIndex ? "pointer" : "default",
              }}
              onClick={() => {
                if (!isDone && index < activeStepIndex) {
                  goToStep((index + 1) as 1 | 2 | 3);
                }
              }}
            >
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error ? <Alert severity="error">{error}</Alert> : null}

        {isDone ? (
          <SuccessPanel
            period={successPeriod ?? period}
            migrationInfo={migrationInfo}
            onClose={restartPayment}
          />
        ) : null}

        {visibleStep === 1 ? (
          <Stack spacing={2}>
            <Typography color="text.secondary">
              Выберите период оплаты и укажите номер, на который оформлена
              подписка.
            </Typography>
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
            <Stack spacing={1.5}>
              {PAYMENT_PERIOD_OPTIONS.map((option) => {
                const selected = Number(period) === option.period;
                return (
                  <Paper
                    key={option.period}
                    variant="outlined"
                    component={ButtonBase}
                    onClick={() => {
                      setValue("period", option.period, {
                        shouldValidate: true,
                      });
                      const next = new URLSearchParams(searchParams);
                      next.set(PAYMENT_STEP_QUERY, "1");
                      next.set(PAYMENT_PERIOD_QUERY, String(option.period));
                      setSearchParams(next, { replace: true });
                    }}
                    sx={(theme) => ({
                      p: 2,
                      width: "100%",
                      display: "block",
                      textAlign: "left",
                      borderWidth: 2,
                      borderColor: selected
                        ? "primary.main"
                        : theme.palette.divider,
                      bgcolor: selected
                        ? alpha(theme.palette.primary.main, 0.06)
                        : "background.paper",
                    })}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography fontWeight={700}>{option.label}</Typography>
                      <Typography fontWeight={700}>{option.amount} ₽</Typography>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
            {errors.period ? (
              <Typography variant="caption" color="error">
                {errors.period.message as string}
              </Typography>
            ) : null}
            <Button variant="contained" size="large" onClick={goToTransfer}>
              Далее
            </Button>
          </Stack>
        ) : null}

        {visibleStep === 2 ? (
          <Stack spacing={2}>
            <Alert severity="info">
              К оплате: <strong>{amount} ₽</strong> за{" "}
              <strong>{periodLabel(period)}</strong>
            </Alert>
            <Alert severity="warning" icon={false}>
              <Stack spacing={1}>
                <Typography variant="body2">
                  Совершите перевод на карту по номеру телефона. Переводите
                  точную сумму за выбранный период.
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  Перевод ТОЛЬКО на OZON банк
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  В случае перевода на другой банк платёж проведён НЕ БУДЕТ
                </Typography>
                {PAYMENT_PHONE ? (
                  <Typography variant="body2">
                    Номер для перевода: <strong>{PAYMENT_PHONE}</strong>
                  </Typography>
                ) : null}
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
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="large"
                onClick={() => goToStep(1)}
                fullWidth
              >
                Назад
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={goToReceipt}
                fullWidth
              >
                Я перевёл
              </Button>
            </Stack>
          </Stack>
        ) : null}

        {visibleStep === 3 ? (
          <Stack spacing={2}>
            <Alert severity="info">
              К оплате: <strong>{amount} ₽</strong> за{" "}
              <strong>{periodLabel(period)}</strong>
            </Alert>
            <Alert severity="warning">
              После перевода обязательно приложите чек. Без квитанции платёж
              проведён не будет.
            </Alert>
            <Box
              ref={pasteAreaRef}
              tabIndex={0}
              sx={{
                border: error ? "2px solid" : "1px dashed",
                borderColor: error
                  ? "error.main"
                  : receipt instanceof File
                    ? "success.main"
                    : "divider",
                borderRadius: 1,
                p: 2,
                outline: "none",
                bgcolor: (theme) =>
                  error
                    ? "rgba(211, 47, 47, 0.04)"
                    : receipt instanceof File
                      ? alpha(theme.palette.success.main, 0.06)
                      : "transparent",
                "&:focus-visible": {
                  borderColor: error ? "error.main" : "primary.main",
                },
              }}
            >
              <Stack spacing={1.5}>
                {receipt instanceof File ? (
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={{ minWidth: 0 }}
                  >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        fontWeight={700}
                        sx={{
                          wordBreak: "break-word",
                          fontSize: "1.05rem",
                          lineHeight: 1.3,
                        }}
                      >
                        {receipt.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatReceiptSize(receipt.size)}
                      </Typography>
                    </Box>
                    {receiptFileIcon(receipt)}
                    <IconButton
                      aria-label="Удалить файл"
                      onClick={clearReceipt}
                      color="error"
                    >
                      <DeleteOutlineRoundedIcon />
                    </IconButton>
                  </Stack>
                ) : (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      Приложите квитанцию или скриншот об оплате. Можно вставить
                      из буфера обмена.
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
                  </>
                )}
              </Stack>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="large"
                onClick={() => goToStep(2)}
                fullWidth
                disabled={submitting}
              >
                Назад
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={openConfirm}
                fullWidth
                disabled={submitting}
              >
                {submitting ? "Проверка и отправка…" : "Отправить квитанцию"}
              </Button>
            </Stack>
          </Stack>
        ) : null}
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
    </Container>
  );
}

function formatReceiptSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} Б`;
  }
  return `${Math.round(bytes / 1024)} КБ`;
}

function receiptFileIcon(file: File) {
  const sx = { fontSize: 36, color: "text.secondary", flexShrink: 0 };
  if (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  ) {
    return <PictureAsPdfOutlinedIcon sx={{ ...sx, color: "error.main" }} />;
  }
  if (file.type.startsWith("image/")) {
    return <ImageOutlinedIcon sx={sx} />;
  }
  return <InsertDriveFileOutlinedIcon sx={sx} />;
}

function SuccessPanel({
  period,
  migrationInfo,
  onClose,
}: {
  period: number;
  migrationInfo: {
    isMigratedToRemnawave: boolean;
    subscriptionUrl?: string | null;
  } | null;
  onClose: () => void;
}) {
  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        borderRadius: 2,
        border: `2px solid ${theme.palette.success.main}`,
        overflow: "hidden",
      })}
    >
      <Box
        sx={(theme) => ({
          pt: 3,
          pb: 2,
          px: 2,
          textAlign: "center",
          background: `linear-gradient(180deg, ${alpha(theme.palette.success.main, 0.14)} 0%, ${alpha(theme.palette.success.main, 0.04)} 100%)`,
        })}
      >
        <CheckCircleRoundedIcon
          sx={(theme) => ({
            fontSize: 72,
            color: theme.palette.success.main,
            filter: `drop-shadow(0 2px 8px ${alpha(theme.palette.success.main, 0.45)})`,
          })}
          aria-hidden
        />
      </Box>
      <Stack spacing={2} sx={{ p: 3, pt: 2 }}>
        <Typography variant="h6" fontWeight={700} textAlign="center">
          Ваш период продлён
        </Typography>
        <Typography>
          Доступ продлён на {period} мес. Обновите подписку вручную в приложении,
          в котором вы используете VPN.
        </Typography>
        {migrationInfo?.isMigratedToRemnawave ? (
          <Alert severity="info">
            <Stack spacing={1}>
              <Typography variant="body2">
                Вас автоматически мигрировали на новый сервер.
              </Typography>
              {migrationInfo.subscriptionUrl ? (
                <Link
                  href={migrationInfo.subscriptionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Получить новую ссылку на подписку с инструкциями
                </Link>
              ) : (
                <Typography variant="body2">
                  Ссылка на подписку пока недоступна. Обратитесь в поддержку.
                </Typography>
              )}
            </Stack>
          </Alert>
        ) : null}
        <Typography variant="caption" color="text.secondary">
          Если у вас есть проблемы, обратитесь в{" "}
          <Link component={RouterLink} to="/support">
            поддержку
          </Link>
        </Typography>
        <Button
          onClick={onClose}
          variant="contained"
          color="success"
          size="large"
        >
          Готово
        </Button>
      </Stack>
    </Paper>
  );
}
