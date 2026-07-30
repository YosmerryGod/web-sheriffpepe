"use client";

import Image from "next/image";
import Link from "next/link";
import { NAV_LINKS, SOCIAL_LINKS, FOOTER_CONFIG, SITE_CONFIG } from "../lib/config";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.main}>
          <div className={styles.brand}>
            <div className={styles.brandLogo}>
              <div className={styles.brandIconWrap}>
                <Image
                  src="/logo.png"
                  alt="Sheriff Pepe"
                  fill
                  className={styles.brandIcon}
                />
              </div>
              <span className={styles.brandText}>
                SHERIFF<span>PEPE</span>
              </span>
            </div>
            <p className={styles.brandDesc}>
              {SITE_CONFIG.description}
            </p>
          </div>

          <div className={styles.links}>
            <h4 className={styles.columnTitle}>Navigation</h4>
            <nav className={styles.linkList}>
              {NAV_LINKS.map((link, index) => (
                <Link key={index} href={link.href} className={styles.link}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className={styles.links}>
            <h4 className={styles.columnTitle}>Community</h4>
            <nav className={styles.linkList}>
              <a 
                href={SOCIAL_LINKS.telegram} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.link}
              >
                Telegram
              </a>
              <a 
                href={SOCIAL_LINKS.twitter} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.link}
              >
                X (Twitter)
              </a>
            </nav>
          </div>

          <div className={styles.newsletter}>
            <h4 className={styles.columnTitle}>Stay Updated</h4>
            <p className={styles.newsletterDesc}>
              Get the latest news and updates.
            </p>
            <div className={styles.form}>
              <input 
                type="email" 
                placeholder="Enter your email" 
                className={styles.input}
              />
              <button className={styles.submit}>Join</button>
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.bottom}>
          <p className={styles.copyright}>{FOOTER_CONFIG.copyright}</p>
          <div className={styles.legal}>
            <span className={styles.disclaimer}>{FOOTER_CONFIG.disclaimer}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}