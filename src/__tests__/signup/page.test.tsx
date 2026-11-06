import "@testing-library/jest-dom";
import SignupPage from "@/app/signup/page";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: mockPush,
    };
  },
}));

describe("SignupPage Component", () => {
  beforeEach(() => {
    mockPush.mockClear();
    global.fetch = jest.fn();
  });

  it("Should render all form elements properly", () => {
    render(<SignupPage />);

    expect(screen.getByText("Create your account")).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it("submits the signup form and redirects to login after success", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
    });

    global.fetch = mockFetch;

    render(<SignupPage />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: {
        value: "Vishal Yadav",
      },
    });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: {
        value: "Vishal@gmail.com",
      },
    });

    fireEvent.change(screen.getByLabelText(/password/i), {
      target: {
        value: "password123",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/auth/signup",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Vishal Yadav",
            email: "Vishal@gmail.com",
            password: "password123",
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login?is_signedup=success");
    });
  });
});
