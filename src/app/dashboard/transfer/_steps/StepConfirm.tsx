"use client";

import { useState } from "react";
import styles from "./steps.module.css";
import type { TransferState } from "../page";

interface Props {
  transfer: TransferState;
  onBack: () => void;
  onReset: () => void;
}

type Status = "idle" | "running" | "done" | "error";

export default function StepConfirm({ transfer, onBack, onReset }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [jobId, setJobId] = useState("");

  async function handleTransfer() {
    setStatus("running");
    setErrorMessage("");

    try {
      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourcePlatform: transfer.sourcePlatform,
          playlistId: transfer.playlistId,
          destinationPlatform: transfer.destinationPlatform,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? "Transfer failed. Please try again.");
        setStatus("error");
        return;
      }

      setJobId(data.jobId);
      setStatus("done");
    } catch {
      setErrorMessage("Couldn't reach the server. Check your connection.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className={styles.step}>
        <div className={styles.successState}>
          <div className={styles.successIcon}>✓</div>
          <h2 className={styles.stepTitle}>Transfer complete</h2>
          <p className={styles.stepSubtitle}>
            <strong>{transfer.playlistName}</strong> has been created on{" "}
            <strong>{transfer.destinationPlatform}</strong>.
          </p>
          <div className={styles.successActions}>
            <button
              className={styles.primaryButton}
              onClick={onReset}
              type="button"
            >
              Start another transfer
            </button>
            {jobId && (
              <a href={`/dashboard/history`} className={styles.backButton}>
                View in history →
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.step}>
      <h2 className={styles.stepTitle}>Ready to transfer?</h2>
      <p className={styles.stepSubtitle}>
        Review the details below before starting.
      </p>

      {/* Summary card */}
      <div className={styles.summary}>
        {transfer.playlistImage && (
          <img
            src={transfer.playlistImage}
            alt={transfer.playlistName ?? ""}
            className={styles.summaryImage}
          />
        )}
        <div className={styles.summaryRows}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Playlist</span>
            <span className={styles.summaryValue}>{transfer.playlistName}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Tracks</span>
            <span className={styles.summaryValue}>
              {transfer.playlistTrackCount}
            </span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>From</span>
            <span className={styles.summaryValue}>
              {transfer.sourcePlatform}
            </span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>To</span>
            <span className={styles.summaryValue}>
              {transfer.destinationPlatform}
            </span>
          </div>
        </div>
      </div>

      {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}

      <div className={styles.confirmActions}>
        <button
          className={styles.primaryButton}
          onClick={handleTransfer}
          disabled={status === "running"}
          type="button"
        >
          {status === "running" ? "Transferring…" : "Start transfer"}
        </button>
        <button
          className={styles.backButton}
          onClick={onBack}
          disabled={status === "running"}
          type="button"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
