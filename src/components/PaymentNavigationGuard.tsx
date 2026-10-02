import * as React from "react";
import { Link as RouterLink, useBlocker, useLocation } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Snackbar from "@mui/material/Snackbar";
import { usePaymentFlow } from "../model/paymentFlow";

export function PaymentNavigationGuard() {
  const location = useLocation();
  const { incomplete, lastPaymentTo } = usePaymentFlow();
  const [noticeOpen, setNoticeOpen] = React.useState(false);

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    return (
      incomplete &&
      currentLocation.pathname === "/payment" &&
      nextLocation.pathname !== "/payment"
    );
  });

  React.useEffect(() => {
    if (!incomplete) {
      setNoticeOpen(false);
      return;
    }
    if (location.pathname !== "/payment") {
      setNoticeOpen(true);
    }
  }, [incomplete, location.pathname]);

  React.useEffect(() => {
    if (!incomplete) {
      return undefined;
    }
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [incomplete]);

  const stayOnPayment = () => {
    if (blocker.state === "blocked") {
      blocker.reset();
    }
  };

  const leavePayment = () => {
    setNoticeOpen(true);
    if (blocker.state === "blocked") {
      blocker.proceed();
    }
  };

  const showLeaveDialog =
    blocker.state === "blocked" && location.pathname === "/payment";

  return (
    <>
      {showLeaveDialog ? (
        <Dialog open onClose={stayOnPayment} fullWidth maxWidth="xs">
          <DialogTitle>Оплата не завершена</DialogTitle>
          <DialogContent>
            Вы не закончили оплату. Если уйдёте сейчас, период подписки не будет
            продлён.
          </DialogContent>
          <DialogActions>
            <Button onClick={stayOnPayment}>Остаться</Button>
            <Button onClick={leavePayment} color="warning" variant="contained">
              Уйти
            </Button>
          </DialogActions>
        </Dialog>
      ) : null}

      <Snackbar
        open={noticeOpen && location.pathname !== "/payment"}
        autoHideDuration={10000}
        onClose={() => setNoticeOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity="warning"
          onClose={() => setNoticeOpen(false)}
          action={
            <Button
              color="inherit"
              size="small"
              component={RouterLink}
              to={lastPaymentTo}
              onClick={() => setNoticeOpen(false)}
            >
              К оплате
            </Button>
          }
        >
          Оплата не завершена. Вернитесь и закончите шаги, иначе период не будет
          продлён.
        </Alert>
      </Snackbar>
    </>
  );
}
