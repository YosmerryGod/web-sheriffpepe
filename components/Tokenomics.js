"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { TOKENOMICS_DATA, TOKEN_INFO } from "../lib/config";
import styles from "./Tokenomics.module.css";

export default function Tokenomics() {
  const [copied, setCopied] = useState(false);
  const { stats, distribution } = TOKENOMICS_DATA;

  const handleCopy = () => {
    navigator.clipboard.writeText(TOKEN_INFO.contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="tokenomics" className={styles.tokenomics}>
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.badge}>TOKENOMICS</span>
          <h2 className={styles.title}>
            FAIR <span>DISTRIBUTION</span>
          </h2>
          <p className={styles.subtitle}>
            TRANSPARENT. DEFLATIONARY. COMMUNITY-FIRST.
          </p>
        </div>

        <div className={styles.stats}>
          {stats.map((stat, index) => (
            <div key={index} className={styles.statCard}>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div className={styles.distribution}>
          <h3 className={styles.distTitle}>TOKEN ALLOCATION</h3>
          <div className={styles.bars}>
            {distribution.map((item, index) => (
              <div key={index} className={styles.barRow}>
                <div className={styles.barLabel}>
                  <span>{item.label}</span>
                  <span className={styles.barPercent}>{item.percent}</span>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: item.percent, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.contract}>
          <span className={styles.contractLabel}>CONTRACT ADDRESS</span>
          <div className={styles.contractBox}>
            <code className={styles.contractAddress}>{TOKEN_INFO.contractAddress}</code>
            <button
              className={styles.copyBtn}
              onClick={handleCopy}
              aria-label="Copy contract address"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}