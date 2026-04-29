import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { PhoneField } from "../components/PhoneField";
import { registerUser } from "../model/authModel";
import {
  registerFormSchema,
  type RegisterFormValues,
} from "../validation/schemas";

export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const referralUserLogin = searchParams.get("referralUserLogin") ?? "";
  const chatIdFromQuery = React.useMemo(() => {
    const raw = searchParams.get("chatId");
    if (!raw) {
      return undefined;
    }
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return undefined;
    }
    return parsed;
  }, [searchParams]);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      referralUserLogin,
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await registerUser(
        data.email,
        data.phone,
        data.password,
        data.referralUserLogin,
        chatIdFromQuery,
      );
      setSuccess(
        "Регистрация успешна. На ваш email отправлено письмо с инструкцией по настройке VPN.",
      );
    } catch (e) {
      const error = e as any;
      setError(error?.message || "Ошибка регистрации");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 65px)",
        display: "grid",
        placeItems: "center",
        px: 2,
        py: 5,
        background:
          "radial-gradient(1200px 500px at -10% -10%, rgba(204,34,48,0.14), transparent 60%), radial-gradient(900px 400px at 110% 100%, rgba(142,167,194,0.28), transparent 65%)",
      }}
    >
      <Container maxWidth="sm" sx={{ px: 0 }}>
        <Paper
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            p: { xs: 2.5, sm: 3.5 },
            backgroundColor: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(4px)",
          }}
        >
          <Stack spacing={3}>
            <Box>
              <Typography variant="h5" component="h1" sx={{ mt: 0.25 }}>
                Регистрация
              </Typography>
              <Typography
                variant="body2"
                color="secondary.main"
                sx={{ mt: 0.5 }}
              >
                Создайте аккаунт для доступа к VPN.
              </Typography>
            </Box>

            {success ? <Alert severity="success">{success}</Alert> : null}
            {error ? <Alert severity="error">{error}</Alert> : null}

            <Box component="form" onSubmit={onSubmit} noValidate>
              <Stack spacing={2}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Email"
                      type="email"
                      size="small"
                      error={Boolean(errors.email)}
                      helperText={errors.email?.message}
                      fullWidth
                    />
                  )}
                />

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
                      size="small"
                      helperText={errors.phone?.message}
                      autoComplete="tel"
                    />
                  )}
                />

                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Пароль"
                      type="password"
                      error={Boolean(errors.password)}
                      size="small"
                      helperText={errors.password?.message}
                      fullWidth
                    />
                  )}
                />

                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Подтверждение пароля"
                      type="password"
                      size="small"
                      error={Boolean(errors.confirmPassword)}
                      helperText={errors.confirmPassword?.message}
                      fullWidth
                    />
                  )}
                />

                <Controller
                  name="referralUserLogin"
                  control={control}
                  render={({ field }) => (
                    <PhoneField
                      label="Номер пользователя, который пригласил вас"
                      name={field.name}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                      size="small"
                      error={Boolean(errors.referralUserLogin)}
                      helperText={errors.referralUserLogin?.message}
                      autoComplete="tel"
                      fullWidth
                    />
                  )}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={submitting}
                >
                  {submitting ? "Отправка..." : "Зарегистрироваться"}
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
