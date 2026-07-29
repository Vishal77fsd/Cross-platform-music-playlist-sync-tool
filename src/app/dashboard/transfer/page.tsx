"use client";

import { useState } from "react";
import styles from "./page.module.css";
import StepPickSource from "./_steps/StepPickSource";
import StepPickPlaylist from "./_steps/StepPickPlaylist";
import StepPickDestination from "./_steps/StepPickDestination";
import StepConfirm from "./_steps/StepConfirm";

export type TransferState = {
  sourcePlatform: string | null;
  playlistId: string | null;
  playlistName: string | null;
  playlistTrackCount: number | null;
  playlistImage: string | null;
  destinationPlatform: string | null;
};

const INITIAL_STATE: TransferState = {
  sourcePlatform: null,
  playlistId: null,
  playlistName: null,
  playlistTrackCount: null,
  playlistImage: null,
  destinationPlatform: null,
};

const STEPS = ["Source", "Playlist", "Destination", "Confirm"];

export default function TransferPage() {
  const [step, setStep] = useState(0);
  const [transfer, setTransfer] = useState<TransferState>(INITIAL_STATE);

  function next() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function reset() {
    setStep(0);
    setTransfer(INITIAL_STATE);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>Transfer</span>
        <h1 className={styles.title}>New transfer</h1>
      </div>

      {/* Step indicators */}
      <div className={styles.stepper}>
        {STEPS.map((label, i) => (
          <div key={label} className={styles.stepIndicatorWrap}>
            <div
              className={`${styles.stepIndicator} ${
                i === step
                  ? styles.stepActive
                  : i < step
                  ? styles.stepDone
                  : styles.stepPending
              }`}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <span
              className={`${styles.stepLabel} ${
                i === step ? styles.stepLabelActive : ""
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`${styles.stepLine} ${
                  i < step ? styles.stepLineDone : ""
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className={styles.content}>
        {step === 0 && (
          <StepPickSource
            onSelect={(platform) => {
              setTransfer((t) => ({ ...t, sourcePlatform: platform }));
              next();
            }}
          />
        )}
        {step === 1 && (
          <StepPickPlaylist
            transfer={transfer}
            onSelect={(playlist) => {
              setTransfer((t) => ({
                ...t,
                playlistId: playlist.id,
                playlistName: playlist.name,
                playlistTrackCount: playlist.trackCount,
                playlistImage: playlist.image ?? null,
              }));
              next();
            }}
            onBack={back}
          />
        )}
        {step === 2 && (
          <StepPickDestination
            transfer={transfer}
            onSelect={(platform) => {
              setTransfer((t) => ({ ...t, destinationPlatform: platform }));
              next();
            }}
            onBack={back}
          />
        )}
        {step === 3 && (
          <StepConfirm
            transfer={transfer}
            onBack={back}
            onReset={reset}
          />
        )}
      </div>
    </div>
  );
}