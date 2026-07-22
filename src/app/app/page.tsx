"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TransferPicker from "@/components/TransferPicker";
import styles from "./page.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; providers: string[] };

export default function TransferAppPage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    fetch("/api/providers")
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json() as Promise<{ providers: { name: string }[] }>;
      })
      .then((data) => setState({ status: "ready", providers: data.providers.map((p) => p.name) }))
      .catch((err: unknown) =>
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Could not reach /api/providers.",
        })
      );
  }, []);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.eyebrowLink}>
          <span className={styles.eyebrow}>music-migrate</span>
        </Link>
        <h1>Move a playlist without rebuilding it by hand.</h1>
        <p className={styles.subhead}>
          Connect two accounts, pick a playlist, and let the matcher do the typing.
        </p>
      </header>

      <main className={styles.main}>
        {state.status === "loading" && <p className={styles.statusLine}>Checking which platforms are available…</p>}

        {state.status === "error" && (
          <div className={styles.statusError}>
            <p>
              Couldn&apos;t reach <code>/api/providers</code>.
            </p>
            <p className={styles.statusDetail}>{state.message}</p>
          </div>
        )}

        {state.status === "ready" && state.providers.length === 0 && (
          <p className={styles.statusLine}>No providers registered yet.</p>
        )}

        {state.status === "ready" && state.providers.length > 0 && (
          <TransferPicker providers={state.providers} />
        )}
      </main>
    </div>
  );
}
