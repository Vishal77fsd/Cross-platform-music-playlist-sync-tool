"use client";

import { useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// 1. Client Content Component (Synchronous)
function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const executionLock = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const savedState = sessionStorage.getItem("oauth_state");

    if (state && savedState && state !== savedState) {
      console.error("CSRF Verification Error: State tokens mismatch.");
      router.push("/dashboard/platforms?error=state_mismatch");
      return;
    }

    if (code && !executionLock.current) {
      executionLock.current = true;

      fetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to trade token");
          return res.json();
        })
        .then((data) => {
          console.log("Tokens securely processed:", data);
          sessionStorage.removeItem("oauth_state");
          router.push("/dashboard/platforms?status=success");
        })
        .catch((err) => {
          console.error("Token swap client error:", err);
          executionLock.current = false; 
          router.push("/dashboard/platforms?error=token_swap_failed");
        });
    }
  }, [searchParams, router]);

  return (
    <div style={{ padding: "20px", textAlign: "center", fontFamily: "sans-serif" }}>
      <h2>Connecting your platform profile...</h2>
      <p>Verifying authentication parameters securely.</p>
    </div>
  );
}

// 2. Default Page Export wrapped cleanly in Suspense (Synchronous)
export default function CallbackPage() {
  return (
    <Suspense 
      fallback={
        <div style={{ padding: "20px", textAlign: "center" }}>
          Loading application context...
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
