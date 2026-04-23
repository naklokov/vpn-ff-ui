import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
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
      );
      setSuccess("Регистрация успешна. Пользователь создан в системе.");
    } catch (e) {
      const error = e as any;
      setError(error?.message || "Ошибка регистрации");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Typography variant="h4" component="h1">
          Регистрация
        </Typography>

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

        <Typography variant="body2" color="text.secondary">
          Уже есть аккаунт?{" "}
          <Button component={RouterLink} to="/login" size="small">
            На страницу входа
          </Button>
        </Typography>

      </Stack>
    </Container>
  );
}
