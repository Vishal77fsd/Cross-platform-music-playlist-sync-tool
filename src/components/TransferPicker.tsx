"use client";

import { useState } from "react";
import { providerLabel } from "@/lib/providerMeta";
import styles from "./TransferPicker.module.css";

interface Props {
  providers: string[];
}

export default function TransferPicker({ providers }: Props) {
  const [source, setSource] = useState<string>(providers[0] ?? "");
  const [destination, setDestination] = useState<string>(providers[1] ?? providers[0] ?? "");

  const canTransfer = Boolean(source) && Boolean(destination) && source !== destination;

  return (
    <div className={styles.picker}>
      <div className={styles.row}>
        <PlatformSelect label="From" value={source} options={providers} onChange={setSource} />

        <div className={styles.path} aria-hidden="true">
          <svg viewBox="0 0 120 24" width="120" height="24">
            <line x1="4" y1="12" x2="100" y2="12" stroke="var(--border)" strokeWidth="2" />
            <circle cx="4" cy="12" r="4" fill="var(--accent)" />
            <path
              d="M94 6 L106 12 L94 18"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <PlatformSelect label="To" value={destination} options={providers} onChange={setDestination} />
      </div>

      {source === destination && source !== "" && (
        <p className={styles.hint}>Pick two different platforms to migrate between.</p>
      )}

      <button className={styles.cta} disabled={!canTransfer} type="button">
        Connect accounts to continue
      </button>
    </div>
  );
}

function PlatformSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className={styles.select}>
      <span className={styles.selectLabel}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {providerLabel(opt)}
          </option>
        ))}
      </select>
    </label>
  );
}
