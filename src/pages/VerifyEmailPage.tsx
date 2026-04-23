import * as React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { verifyEmailByToken } from '../model/authModel';

function readToken(search: string): string | undefined {
  const params = new URLSearchParams(search);
  return params.get('token') ?? undefined;
}

export function VerifyEmailPage() {
  const location = useLocation();
  const token = readToken(location.search);

  const [loading, setLoading] = React.useState(true);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!token) {
      setError('Некорректная ссылка подтверждения: отсутствует token.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    verifyEmailByToken(token)
      .then(() => {
        setSuccess('Подтверждение успешно.');
      })
      .catch((e) => {
        setError(
          e instanceof Error ? e.message : 'Ошибка проверки ссылки подтверждения.'
        );
      })
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Typography variant="h4" component="h1">
          Подтверждение email
        </Typography>

        {loading ? <Typography>Проверяем параметры ссылки...</Typography> : null}
        {success ? <Alert severity="success">{success}</Alert> : null}
        {error ? <Alert severity="error">{error}</Alert> : null}

        <Button component={RouterLink} to="/login" variant="contained">
          Перейти на страницу входа
        </Button>
      </Stack>
    </Container>
  );
}

