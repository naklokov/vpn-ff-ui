import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Container from '@mui/material/Container';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  clearSavedCredentials,
  getSavedCredentials,
  loginUser,
  saveCredentials,
} from '../model/authModel';
import { loginFormSchema, type LoginFormValues } from '../validation/schemas';

export function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const remembered = getSavedCredentials();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: remembered?.email ?? '',
      password: remembered?.password ?? '',
      rememberMe: Boolean(remembered),
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    setError(null);
    setSubmitting(true);
    try {
      await loginUser(data.email, data.password);
      if (data.rememberMe) {
        saveCredentials(data.email, data.password);
      } else {
        clearSavedCredentials();
      }
      navigate('/', { replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка входа';
      if (msg === 'EMAIL_NOT_CONFIRMED') {
        setError('Email не подтвержден. Завершите подтверждение по ссылке из письма.');
        return;
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Typography variant="h4" component="h1">
          Вход
        </Typography>

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
                  autoComplete="email"
                  fullWidth
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
                  autoComplete="current-password"
                  fullWidth
                />
              )}
            />

            <Controller
              name="rememberMe"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox checked={field.value} onChange={(_, checked) => field.onChange(checked)} />}
                  label="Запомнить меня (сохранить email и пароль)"
                />
              )}
            />

            <Button type="submit" variant="contained" size="large" disabled={submitting}>
              {submitting ? 'Вход...' : 'Войти'}
            </Button>
          </Stack>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Нет аккаунта?{' '}
          <Button component={RouterLink} to="/register" size="small">
            Перейти к регистрации
          </Button>
        </Typography>
      </Stack>
    </Container>
  );
}

