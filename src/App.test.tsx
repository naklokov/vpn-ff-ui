import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders app shell", () => {
  render(<App />);
  expect(screen.getByRole("link", { name: "VPN FF" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Оплата" })).toBeInTheDocument();
});
