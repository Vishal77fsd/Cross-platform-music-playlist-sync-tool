import "@testing-library/jest-dom";
import LoginForm from "@/app/login/page";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: mockPush,
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

describe("LoginPage Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Should render all elements properly", () => {
    render(<LoginForm />);

    expect(
      screen.getByRole("heading", { level: 1, name: /Log in/i }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Log in/i })).toBeInTheDocument();
  });

  it("submits the login form and redirects to dashboard after success", async () => {
    // FIX: Added mock json method to prevent response.json errors
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        user: { email: "Vishal@gmail.com" },
      }),
    });
    global.fetch = mockFetch;

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "Vishal@gmail.com" },
    });

    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Log in/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/auth/login",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "Vishal@gmail.com",
            password: "password123",
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("displays an error message when authentication fails", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: "Invalid credentials" }),
    });
    global.fetch = mockFetch;

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "Vishal@gmail.com" },
    });

    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrongpassword" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Log in/i }));

    // Assert that an error alert or text appears on the screen
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});
