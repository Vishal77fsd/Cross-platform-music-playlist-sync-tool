"use client";

import { useState } from "react";
import AuthLayout from "@/components/AuthLayout";
import formStyles from "@/components/AuthForm.module.css";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter(); // Initialize the router
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        throw new Error("Failed to create account");
      }
      if (response.status === 201) {
        router.push(`/login?is_signedup=success`);
        return;
      }
      setFormData({
        name: "",
        email: "",
        password: "",
      });
    } catch (error) {
      console.error("Error creating account:", error);
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }

    // NOTE: static placeholder, same as the login page — wire this up
    // to a real POST /api/auth/signup route once one exists.
    setSubmitted(true);
  }

  return (
    <AuthLayout
      eyebrow="Get started"
      title="Create your account"
      subtitle="Free to start. Connect your platforms after you sign up."
      footerPrompt="Already have an account?"
      footerLinkLabel="Log in"
      footerLinkHref="/login"
    >
      <form className={formStyles.form} onSubmit={handleSubmit}>
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="name">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            name="name"
            placeholder="Jamie Rivera"
            className={formStyles.input}
            required
            onChange={handleInputChange}
          />
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            value={formData.email}
            type="email"
            name="email"
            placeholder="you@example.com"
            className={formStyles.input}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            name="password"
            placeholder="At least 8 characters"
            className={formStyles.input}
            required
            value={formData.password}
            minLength={8}
            onChange={handleInputChange}
          />
        </div>

        <button
          type="submit"
          className={formStyles.submit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>

        {submitted && (
          <p style={{ fontSize: 13, color: "var(--text-dim)", margin: 0 }}>
            {/* TODO Change this to porper message */}
            Form submitted! Please check your email for a confirmation link.
          </p>
        )}
      </form>

      <div className={formStyles.divider}>or</div>

      <div className={formStyles.oauthRow}>
        <button
          type="button"
          className={formStyles.oauthButton}
          disabled={isSubmitting}
        >
          Continue with Google
        </button>
      </div>
    </AuthLayout>
  );
}
