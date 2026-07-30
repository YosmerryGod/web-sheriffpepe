import { Users, Flame, Zap, TrendingUp } from "lucide-react";
import { ABOUT_FEATURES } from "../lib/config";
import styles from "./About.module.css";

const ICON_MAP = {
  Users,
  Flame,
  Zap,
  TrendingUp,
};

export default function About() {
  return (
    <section id="about" className={styles.about}>
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.badge}>ABOUT</span>
          <h2 className={styles.title}>
            WHY <span>PEPE SHERIFF</span>?
          </h2>
          <p className={styles.subtitle}>
            THE MOST TRUSTED FROG IN THE WILD WEST OF CRYPTO
          </p>
        </div>

        <div className={styles.grid}>
          {ABOUT_FEATURES.map((feature, index) => {
            const IconComponent = ICON_MAP[feature.icon];
            return (
              <div key={index} className={styles.card}>
                <div className={styles.cardIcon}>
                  <IconComponent size={40} strokeWidth={2.5} />
                </div>
                <h3 className={styles.cardTitle}>{feature.title}</h3>
                <p className={styles.cardDesc}>{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}