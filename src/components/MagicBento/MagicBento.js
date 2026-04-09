'use client';

import styles from './MagicBento.module.css';

export default function MagicBento({ features = [] }) {
  return (
    <div className={styles.grid}>
      {features.map((feature, idx) => {
        const Icon = feature.icon;
        return (
          <div
            key={feature.title}
            data-feature-card
            style={{ '--feature-index': idx }}
            className={feature.tone === 'large' ? styles.spanTwo : ''}
          >
            <article className={styles.card}>
              <Icon size={30} strokeWidth={1.8} className={styles.icon} />
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </article>
          </div>
        );
      })}
    </div>
  );
}
