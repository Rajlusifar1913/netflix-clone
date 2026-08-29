import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import { AuthForm } from "../components/AuthForm";

describe("AuthForm Component", () => {
  it("renders login form correctly with email and password fields", () => {
    render(
      <BrowserRouter>
        <AuthForm mode="login" />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("renders register form with full name field", () => {
    render(
      <BrowserRouter>
        <AuthForm mode="register" />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(/full name/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
  });

  it("renders navigation link to register page from login form", () => {
    render(
      <BrowserRouter>
        <AuthForm mode="login" />
      </BrowserRouter>
    );

    expect(screen.getByRole("link", { name: /sign up now/i })).toBeInTheDocument();
  });
});
