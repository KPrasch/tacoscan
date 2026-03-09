import React from 'react';
import css from './Skeleton.module.css';

// Base shimmer bar — width/height in px
const S = ({ w, h = 12 }) => (
  <div className={css.shimmer} style={{ width: w, height: h }} />
);

// Deterministic "varied" widths that look natural across rows/cols
const colW = (col, row) => {
  const ranges = [
    [30, 50],   // col 0: ID / narrow
    [70, 110],  // col 1: address / name
    [80, 140],  // col 2: medium text
    [45, 70],   // col 3: number / count
    [50, 80],   // col 4: age / time
    [60, 100],  // col 5
    [70, 120],  // col 6
    [40, 65],   // col 7
  ];
  const [min, max] = ranges[col % ranges.length];
  return min + ((row * 17 + col * 31) % (max - min + 1));
};

/* ── SkeletonRows ──────────────────────────────────────────────────────────
   Drops directly into <tbody>. cols = number of columns.
*/
export function SkeletonRows({ rows = 8, cols = 5 }) {
  return Array.from({ length: rows }, (_, r) => (
    <tr key={r} className={css.skRow}>
      {Array.from({ length: cols }, (_, c) => (
        <td key={c}>
          <S w={colW(c, r)} />
        </td>
      ))}
    </tr>
  ));
}

/* ── PageSkeleton ──────────────────────────────────────────────────────────
   Full detail-page skeleton. Matches NodeDetail / RitualDetail /
   SigningCohortDetail layout (breadcrumb + 2-col grid + tabs + table).
*/
export function PageSkeleton() {
  return (
    <div className={css.page}>
      <div className={css.container}>

        {/* Breadcrumb + pills */}
        <div className={css.headerRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <S w={52} h={13} />
            <S w={8} h={13} />
            <S w={110} h={13} />
          </div>
          <div className={css.headerMeta}>
            {[64, 88, 56].map((w, i) => <S key={i} w={w} h={20} />)}
          </div>
        </div>

        {/* Two-column info grid */}
        <div className={css.infoGrid}>
          {/* Left card: identity KVs */}
          <div className={css.infoCard}>
            <S w={52} h={10} className={css.cardTitle} />
            {[120, 96, 80, 100, 64, 88, 48, 110, 72].map((w, i) => (
              <div key={i} className={css.kv}>
                <S w={72} h={10} />
                <S w={w} h={11} />
              </div>
            ))}
          </div>
          {/* Right card: staking / cohort info */}
          <div className={css.infoCard}>
            <S w={80} h={10} className={css.cardTitle} />
            {[180, 140, 200, 100, 160, 120].map((w, i) => (
              <div key={i} className={css.kv}>
                <S w={88} h={10} />
                <S w={w} h={11} />
              </div>
            ))}
          </div>
        </div>

        {/* Tab strip */}
        <div className={css.tabs}>
          {[90, 110, 70, 80].map((w, i) => (
            <S key={i} w={w} h={30} />
          ))}
        </div>

        {/* Tab body with skeleton table */}
        <div className={css.tabBody}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <SkeletonRows rows={6} cols={4} />
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

/* ── ListSkeleton ──────────────────────────────────────────────────────────
   For early-return list pages (Infractions, Rewards, NetworkActivity,
   Heartbeats) — shows a PageHeader-shaped area + table with skeleton rows.
*/
export function ListSkeleton({ cols = 5, rows = 10 }) {
  return (
    <div className={css.listPage}>
      <div className={css.listContainer}>

        {/* PageHeader-shaped area */}
        <div className={css.listHeader}>
          <div className={css.listHeaderLeft}>
            <S w={160} h={22} />
            <S w={280} h={12} />
          </div>
          <div className={css.listHeaderStats}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={css.statBlock}>
                <S w={[40, 56, 48, 64][i]} h={11} />
                <S w={[32, 28, 36, 24][i]} h={18} />
              </div>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className={css.tableWrap}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <SkeletonRows rows={rows} cols={cols} />
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
