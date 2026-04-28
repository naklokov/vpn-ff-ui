import * as React from 'react';
import {
  BrowserRouter,
  Link as RouterLink,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { RegisterPage } from './pages/RegisterPage';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1565c0' },
    secondary: { main: '#00838f' },
  },
  shape: { borderRadius: 10 },
});

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" component={RouterLink} to="/register" sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}>
            VPN FF
          </Typography>
          <Button component={RouterLink} to="/register" color="inherit" size="small">
            Регистрация
          </Button>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flex: 1, bgcolor: 'background.default' }}>
        <Container maxWidth={false} disableGutters>
          {children}
        </Container>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Navigate to="/register" replace />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="*" element={<Navigate to="/register" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
