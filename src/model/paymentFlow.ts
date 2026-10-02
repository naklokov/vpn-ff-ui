import * as React from "react";

const INCOMPLETE_KEY = "vpn-ff-payment-incomplete";
const LAST_LOCATION_KEY = "vpn-ff-payment-last-location";

export const PAYMENT_STEP_QUERY = "step";
export const PAYMENT_PERIOD_QUERY = "period";

export type PaymentStep = 1 | 2 | 3 | "done";

export const PERIOD_AMOUNT_MAP: Record<number, number> = {
  1: 300,
  3: 750,
  6: 1300,
};

export const PAYMENT_PERIOD_OPTIONS = [
  { period: 1, amount: 300, label: "1 месяц" },
  { period: 3, amount: 750, label: "3 месяца" },
  { period: 6, amount: 1300, label: "6 месяцев" },
] as const;

type PaymentFlowContextValue = {
  incomplete: boolean;
  lastPaymentTo: string;
  setIncomplete: (value: boolean) => void;
  setLastPaymentTo: (to: string) => void;
};

const PaymentFlowContext = React.createContext<PaymentFlowContextValue | null>(
  null,
);

export function getPaymentIncomplete(): boolean {
  try {
    return sessionStorage.getItem(INCOMPLETE_KEY) === "1";
  } catch {
    return false;
  }
}

export function persistPaymentIncomplete(value: boolean): void {
  try {
    if (value) {
      sessionStorage.setItem(INCOMPLETE_KEY, "1");
    } else {
      sessionStorage.removeItem(INCOMPLETE_KEY);
      sessionStorage.removeItem(LAST_LOCATION_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function persistLastPaymentLocation(search: string): void {
  try {
    const url = search.startsWith("/payment")
      ? search
      : `/payment${search.startsWith("?") ? search : `?${search}`}`;
    sessionStorage.setItem(LAST_LOCATION_KEY, url);
  } catch {
    // ignore storage errors
  }
}

export function getLastPaymentLocation(): string {
  try {
    return sessionStorage.getItem(LAST_LOCATION_KEY) || "/payment?step=1";
  } catch {
    return "/payment?step=1";
  }
}

export function parsePaymentStep(raw: string | null): PaymentStep {
  if (raw === "done") {
    return "done";
  }
  const n = Number(raw);
  if (n === 2 || n === 3) {
    return n;
  }
  return 1;
}

export function parsePaymentPeriod(raw: string | null): 1 | 3 | 6 {
  const n = Number(raw);
  if (n === 3 || n === 6) {
    return n;
  }
  return 1;
}

export function periodLabel(period: number): string {
  if (period === 3) {
    return "3 месяца";
  }
  if (period === 6) {
    return "6 месяцев";
  }
  return "1 месяц";
}

export function PaymentFlowProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [incomplete, setIncompleteState] = React.useState(getPaymentIncomplete);
  const [lastPaymentTo, setLastPaymentToState] = React.useState(
    getLastPaymentLocation,
  );

  const setIncomplete = React.useCallback((value: boolean) => {
    persistPaymentIncomplete(value);
    setIncompleteState(value);
    if (!value) {
      setLastPaymentToState("/payment?step=1");
    }
  }, []);

  const setLastPaymentTo = React.useCallback((to: string) => {
    persistLastPaymentLocation(to);
    setLastPaymentToState(
      to.startsWith("/payment")
        ? to
        : `/payment${to.startsWith("?") ? to : `?${to}`}`,
    );
  }, []);

  const value = React.useMemo(
    () => ({ incomplete, lastPaymentTo, setIncomplete, setLastPaymentTo }),
    [incomplete, lastPaymentTo, setIncomplete, setLastPaymentTo],
  );

  return React.createElement(PaymentFlowContext.Provider, { value }, children);
}

export function usePaymentFlow(): PaymentFlowContextValue {
  const ctx = React.useContext(PaymentFlowContext);
  if (!ctx) {
    throw new Error("usePaymentFlow must be used within PaymentFlowProvider");
  }
  return ctx;
}
