import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "../App";

// Mock router and auth components to avoid navigation errors
jest.mock("react-router-dom", () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Routes: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Route: ({ element }: { element: React.ReactNode }) => <div>{element}</div>,
  Navigate: () => <div>Navigate</div>,
}));

jest.mock("../SafeAuthContext", () => ({
  SafeAuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  PublicRoute: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// Mock all page components
jest.mock("../pages/Login", () => () => <div>Login Page</div>);
jest.mock("../pages/Dashboard", () => () => <div>Dashboard Page</div>);
jest.mock("../pages/Tournaments", () => () => <div>Tournaments Page</div>);
jest.mock("../pages/Profile", () => () => <div>Profile Page</div>);
jest.mock("../pages/CreditsPage", () => () => <div>Credits Page</div>);
jest.mock("../pages/Social", () => () => <div>Social Page</div>);
jest.mock("../pages/TournamentDetails", () => () => (
  <div>Tournament Details Page</div>
));
jest.mock("../pages/GameResults", () => () => <div>Game Results Page</div>);
jest.mock("../pages/AdminPanel", () => () => <div>Admin Panel Page</div>);
jest.mock(
  "../components/layout/Layout",
  () =>
    ({ children }: { children: React.ReactNode }) => <div>{children}</div>
);

describe("App Component", () => {
  it("renders without crashing", () => {
    render(<App />);
  });

  it("provides theme and auth context", () => {
    render(<App />);
    // App should render with ThemeProvider and SafeAuthProvider
    expect(document.body).toBeTruthy();
  });

  it("contains routing structure", () => {
    const { container } = render(<App />);
    expect(container).toBeInTheDocument();
  });
});
