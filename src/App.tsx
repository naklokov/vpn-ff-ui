import * as React from "react";
import {
  BrowserRouter,
  Link as RouterLink,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { RegisterPage } from "./pages/RegisterPage";
import { PaymentPage } from "./pages/PaymentPage";
import { SupportPage } from "./pages/SupportPage";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#cc2230" },
    secondary: { main: "#6f89a2" },
    background: {
      default: "#f4f7fb",
      paper: "#ffffff",
    },
    text: {
      primary: "#2a2530",
      secondary: "#665f68",
    },
  },
  shape: { borderRadius: 6 },
  typography: {
    fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
    h6: {
      fontWeight: 700,
      letterSpacing: "0.01em",
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(8px)",
          backgroundColor: "rgba(255, 255, 255, 0.86)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          paddingInline: 16,
        },
        containedPrimary: {
          boxShadow: "none",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
  },
});

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/register"
            sx={{ flexGrow: 1, textDecoration: "none", color: "inherit" }}
          >
            VPN FF
          </Typography>
          <Button
            component={RouterLink}
            to="/register"
            color="inherit"
            size="small"
          >
            Регистрация
          </Button>
          <Button
            component={RouterLink}
            to="/payment"
            color="inherit"
            size="small"
          >
            Оплата
          </Button>
          <Button
            component={RouterLink}
            to="/support"
            color="inherit"
            size="small"
          >
            Поддержка
          </Button>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flex: 1, bgcolor: "background.default" }}>
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
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="*" element={<Navigate to="/register" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
