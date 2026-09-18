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
  const [result, setResult] = useState<{} | null>(null);
  const [progress, setProgress] = useState<{
    total: number;
    matched: number;
    unmatched: number;
    percent: number;
  } | null>(null);

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
          playlistName: transfer.playlistName,
          destinationPlatform: transfer.destinationPlatform,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? "Failed to start transfer.");
        setStatus("error");
        return;
      }

      const jobId = data.jobId;

      // Poll every 2 seconds until done
      const interval = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/transfer/${jobId}`);
          const pollData = await pollRes.json();

          // Update live progress
          if (pollData.totalTracks > 0) {
            setProgress({
              total: pollData.totalTracks,
              matched: pollData.matchedCount,
              unmatched: pollData.unmatchedCount,
              percent: pollData.matchPercent,
            });
          }

          if (pollData.status === "completed") {
            clearInterval(interval);
            setResult({
              matchedCount: pollData.matchedCount,
              unmatchedCount: pollData.unmatchedCount,
              totalTracks: pollData.totalTracks,
              matchPercent: pollData.matchPercent,
              unmatched: pollData.unmatchedTracks ?? [],
            });
            setStatus("done");
          } else if (pollData.status === "failed") {
            clearInterval(interval);
            setErrorMessage(pollData.error ?? "Transfer failed.");
            setStatus("error");
          }
        } catch(error) {
          clearInterval(interval);
          console.log(error);
          setErrorMessage(`Lost connection while tracking progress. Error : ${error}`);
          setStatus("error");
        }
      }, 2000);
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
      {status === "running" && (
        <div className={styles.progressWrap}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: progress ? `${progress.percent}%` : "0%" }}
            />
          </div>
          <p className={styles.progressText}>
            {progress
              ? `${progress.matched} of ${progress.total} tracks matched…`
              : "Starting transfer…"}
          </p>
        </div>
      )}
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
