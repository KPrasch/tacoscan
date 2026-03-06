import React from 'react';
import styles from './PageHeader.module.css';

/**
 * Standard page header: title + subtitle left, stats right.
 *
 * stats: [{ label: string, value: string|number }]
 */
export default function PageHeader({ title, subtitle, stats = [] }) {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.left}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {stats.length > 0 && (
        <div className={styles.stats}>
          {stats.map((s, i) => (
            <div key={i} className={styles.stat}>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
