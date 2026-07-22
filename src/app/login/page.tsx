"use client";

import { useState } from "react";
import AuthLayout from "@/components/AuthLayout";
import formStyles from "@/components/AuthForm.module.css";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSignedUp = searchParams.get("is_signedup") === "success";

  // STATE
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message);
        return;
      }

      if(response.status === 200) {
        router.push("/dashboard");
        return;
      }

    } catch (err) {
      console.error("Error during login:", err);
    }finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Log in"
      subtitle="Pick up a transfer or start a new one."
      footerPrompt="Don't have an account?"
      footerLinkLabel="Sign up"
      footerLinkHref="/signup"
    >
      {isSignedUp && !error && (
        <div className={styles.successBanner}>
          <h3 className={styles.successTitle}>Account created successfully!</h3>
          <p className={styles.successText}>
            Please check your email inbox for a confirmation link to verify your
            account.
          </p>
        </div>
      )}

      {error && (
        <div className={styles.successBanner}>
          <p className={styles.successText}>{error}</p>
        </div>
      )}
      <form className={formStyles.form} onSubmit={handleSubmit}>
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="you@example.com"
            className={formStyles.input}
            required
            value={formData.email}
            onChange={handleInputChange}
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
            placeholder="••••••••"
            className={formStyles.input}
            value={formData.password}
            required
            minLength={8}
            onChange={handleInputChange}
          />
        </div>

        <button type="submit" className={formStyles.submit} disabled={isSubmitting}>
          Log in
        </button>
      </form>

      <div className={formStyles.divider}>or</div>

      <div className={formStyles.oauthRow}>
        <button type="button" className={formStyles.oauthButton} disabled={isSubmitting}>
          Continue with Google
        </button>
      </div>
    </AuthLayout>
  );
}
