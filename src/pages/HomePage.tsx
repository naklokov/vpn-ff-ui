import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { logout } from '../model/authModel';

export function HomePage() {
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Stack spacing={3} alignItems="flex-start">
        <Typography variant="h4" component="h1" gutterBottom>
          Главная страница
        </Typography>
        <Typography color="text.secondary">
          Вы успешно вошли в систему. Содержимое главной страницы можно расширить позже.
        </Typography>
        <Button variant="outlined" onClick={onLogout}>
          Выйти
        </Button>
      </Stack>
    </Container>
  );
}
