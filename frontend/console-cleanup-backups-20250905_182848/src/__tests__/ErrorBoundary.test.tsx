import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ErrorBoundary from "../components/ErrorBoundary";

// Mock component that throws an error
const ErrorThrowingComponent = () => {
  throw new Error("Test error");
};

// Mock component that works normally
const WorkingComponent = () => <div>Working component</div>;

// Mock fetch for error logging
global.fetch = jest.fn();

describe("ErrorBoundary", () => {
  beforeEach(() => {
    // Mock console.error to avoid error logs in tests
    jest.spyOn(console, "error").mockImplementation(() => {});

    // Clear localStorage
    localStorage.clear();

    // Reset fetch mock
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <WorkingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText("Working component")).toBeInTheDocument();
  });

  it("renders error UI when there is an error", () => {
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText("Oops! Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText(/We're sorry, but something unexpected happened/)
    ).toBeInTheDocument();
  });

  it("displays error ID when error occurs", () => {
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Error ID:/)).toBeInTheDocument();
  });

  it("shows debug info in development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText("Development Debug Info")).toBeInTheDocument();
    expect(screen.getByText(/Error:/)).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it("renders custom fallback when provided", () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText("Custom error message")).toBeInTheDocument();
    expect(
      screen.queryByText("Oops! Something went wrong")
    ).not.toBeInTheDocument();
  });

  it("calls onError callback when error occurs", () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it("logs error to service", () => {
    // Mock successful fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    expect(global.fetch).toHaveBeenCalledWith("/api/frontend-errors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: expect.stringContaining('"message":"Test error"'),
    });
  });

  it("stores error in localStorage", () => {
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    const storedErrors = localStorage.getItem("lfa_errors");
    expect(storedErrors).toBeTruthy();

    const errors = JSON.parse(storedErrors!);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      message: "Test error",
      timestamp: expect.any(String),
      errorId: expect.any(String),
    });
  });
});
