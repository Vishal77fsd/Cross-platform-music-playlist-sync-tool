"use client";

import { useRouter } from "next/navigation";
import styles from "../app/dashboard/layout.module.css";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <button onClick={handleLogout} className={styles.logoutButton} type="button">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Log out
    </button>
  );
}