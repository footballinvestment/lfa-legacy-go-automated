import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SafeAuthProvider, useSafeAuth } from "../SafeAuthContext";

// Mock API service
jest.mock("../services/api", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// Test component that uses the auth context
const TestComponent: React.FC = () => {
  const { isAuthenticated, user, loading } = useSafeAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div>Authenticated: {isAuthenticated ? "Yes" : "No"}</div>
      <div>User: {user ? user.username : "None"}</div>
    </div>
  );
};

describe("SafeAuthContext", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("provides initial auth state", async () => {
    render(
      <SafeAuthProvider>
        <TestComponent />
      </SafeAuthProvider>
    );

    // Should show loading initially
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    // Wait for auth check to complete
    await waitFor(() => {
      expect(screen.getByText("Authenticated: No")).toBeInTheDocument();
    });
  });

  it("handles no stored token", async () => {
    render(
      <SafeAuthProvider>
        <TestComponent />
      </SafeAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Authenticated: No")).toBeInTheDocument();
      expect(screen.getByText("User: None")).toBeInTheDocument();
    });
  });

  it("provides auth context methods", () => {
    const TestMethodsComponent = () => {
      const authContext = useSafeAuth();

      return (
        <div>
          <div>
            Has login: {typeof authContext.login === "function" ? "Yes" : "No"}
          </div>
          <div>
            Has logout:{" "}
            {typeof authContext.logout === "function" ? "Yes" : "No"}
          </div>
        </div>
      );
    };

    render(
      <SafeAuthProvider>
        <TestMethodsComponent />
      </SafeAuthProvider>
    );

    expect(screen.getByText("Has login: Yes")).toBeInTheDocument();
    expect(screen.getByText("Has logout: Yes")).toBeInTheDocument();
  });

  it("throws error when used outside provider", () => {
    // Suppress console.error for this test
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow("useSafeAuth must be used within a SafeAuthProvider");

    consoleSpy.mockRestore();
  });
});
