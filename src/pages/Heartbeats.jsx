import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getRituals, detectHeartbeatGroups, formatRitualsData, formatString, formatTimeToText, getTimeout, getLiveRitualIds } from "./data";
import styles from "./Heartbeats.module.css";
import PageHeader from "../components/PageHeader";
import { ListSkeleton } from "../components/Skeleton";

const Heartbeats = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [allHeartbeats, setAllHeartbeats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ritualsData, timeout] = await Promise.all([getRituals(), getTimeout()]);
        const rawRituals = ritualsData?.rituals || [];
        const liveRitualIds = await getLiveRitualIds().catch(() => new Set());
        const rituals = formatRitualsData(rawRituals, timeout, liveRitualIds);
        const heartbeatRituals = rituals.filter(r => r.isHeartbeat);
        setAllHeartbeats(heartbeatRituals);
        const detected = detectHeartbeatGroups(rituals, timeout);
        // Sort by recency (most recent first)
        detected.sort((a, b) => new Date(b.mondayMidnight) - new Date(a.mondayMidnight));
        setGroups(detected);
      } catch (err) {
        console.error("Failed to fetch heartbeats:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const totalGroups = groups.length;
    const totalRituals = allHeartbeats.length;
    const successful = allHeartbeats.filter(r => r.status === "SUCCESSFUL" || r.status === "ACTIVE").length;
    const failed = allHeartbeats.filter(r => r.status === "TIME OUT" || r.status === "FAILED").length;
    const successRate = totalRituals > 0 ? ((successful / totalRituals) * 100).toFixed(1) : "0.0";

    // Unique participants across all heartbeats
    const allParticipants = new Set();
    allHeartbeats.forEach(r => r.participants.forEach(p => allParticipants.add(p)));

    return { totalGroups, totalRituals, successful, failed, successRate, uniqueParticipants: allParticipants.size };
  }, [groups, allHeartbeats]);

  const formatWeekDate = (mondayMidnight) => {
    if (!mondayMidnight) return "Unknown";
    const d = new Date(mondayMidnight);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Build weekly heatmap — one square per week, 52 weeks
  const weeklyData = useMemo(() => {
    // Bucket heartbeats by ISO week start (Monday)
    const weekMap = {};
    allHeartbeats.forEach(r => {
      const ts = r.initTimeStamp || r.startedAt;
      if (!ts) return;
      const d = new Date(ts);
      const day = d.getDay();
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((day + 6) % 7));
      const key = monday.toISOString().split('T')[0];
      if (!weekMap[key]) weekMap[key] = { total: 0, successful: 0, failed: 0 };
      weekMap[key].total++;
      if (r.status === "SUCCESSFUL" || r.status === "ACTIVE") weekMap[key].successful++;
      else weekMap[key].failed++;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - 51 * 7);
    const weeks = [];
    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 7)) {
      const key = d.toISOString().split('T')[0];
      weeks.push({ week: key, ...(weekMap[key] || { total: 0, successful: 0, failed: 0 }) });
    }
    return weeks;
  }, [allHeartbeats]);

  const maxCount = useMemo(() => Math.max(1, ...weeklyData.map(w => w.total)), [weeklyData]);

  const getHeatColor = (count, failed) => {
    if (count === 0) return 'var(--bg-tertiary)';
    if (failed > 0) {
      const ratio = failed / count;
      if (ratio > 0.5) return '#dc2626';
      if (ratio > 0.2) return '#f59e0b';
    }
    const intensity = Math.min(count / maxCount, 1);
    if (intensity < 0.25) return '#86efac';
    if (intensity < 0.5) return '#4ade80';
    if (intensity < 0.75) return '#22c55e';
    return '#16a34a';
  };

  if (loading) return <ListSkeleton cols={4} rows={8} />;

  const SQ = 6, GAP = 2, STRIDE = SQ + GAP;
  const svgW = weeklyData.length * STRIDE - GAP;
  const svgH = SQ;

  return (
    <div className={styles.networkActivity}>
      <div className={styles.container}>
        <PageHeader
          title="Heartbeats"
          subtitle="Weekly liveness checks — small DKG rituals (≤3 participants) that verify node availability. Distinct from full DKG key generation ceremonies."
          stats={[
            { label: 'Weekly Groups', value: stats.totalGroups },
            { label: 'Total Rituals', value: stats.totalRituals },
            { label: 'Success Rate', value: `${stats.successRate}%` },
            { label: 'Participants', value: stats.uniqueParticipants },
          ]}
        />

        {/* Heartbeat Heatmap — compact SVG */}
        <div className={styles.heatmapSection}>
          <div className={styles.heatmapHeader}>
            <span className={styles.heatmapTitle}>Heartbeat activity — last 52 weeks</span>
            <div className={styles.heatmapLegend}>
              {[['#22c55e','Successful'],['#f59e0b','Partial'],['#dc2626','Failed']].map(([color, label]) => (
                <span key={label} className={styles.legendItem}>
                  <svg width={7} height={7} style={{ flexShrink: 0 }}>
                    <rect width={7} height={7} rx={1} fill={color} opacity={0.85} />
                  </svg>
                  {label}
                </span>
              ))}
              <span className={styles.legendRight}>← older · newer →</span>
            </div>
          </div>
          <div className={styles.heatmapSvgWrap}>
            <svg width="100%" height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}
              preserveAspectRatio="xMinYMid meet" style={{ display: 'block' }}>
              {weeklyData.map((w, i) => (
                <rect
                  key={i}
                  x={i * STRIDE}
                  y={0}
                  width={SQ}
                  height={SQ}
                  rx={1}
                  fill={getHeatColor(w.total, w.failed)}
                  opacity={w.total === 0 ? 0.3 : 0.85}
                >
                  <title>Week of {w.week}: {w.total} heartbeats ({w.successful} ok, {w.failed} failed)</title>
                </rect>
              ))}
            </svg>
          </div>
        </div>

        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <span className={styles.tableInfo}>{groups.length} heartbeat groups (most recent first)</span>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.activityTable}>
              <thead>
                <tr>
                  <th>Week</th>
                  <th>Date</th>
                  <th>Rituals</th>
                  <th>Successful</th>
                  <th>Failed</th>
                  <th>Success Rate</th>
                  <th>Participants</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group, idx) => (
                  <tr key={idx} style={{ cursor: "pointer" }} onClick={() => navigate(`/heartbeat-group/${new Date(group.mondayMidnight).toISOString().split('T')[0]}`)}>
                    <td>
                      <span className={styles.eventType} style={{ color: "#10B981", borderColor: "#10B981" }}>
                        Week {group.weekNumber}
                      </span>
                    </td>
                    <td>{formatWeekDate(group.mondayMidnight)}</td>
                    <td style={{ fontWeight: 600 }}>{group.stats.total}</td>
                    <td>
                      <span style={{ color: "#10B981", fontWeight: 600 }}>{group.stats.successful}</span>
                    </td>
                    <td>
                      <span style={{ color: group.stats.failed > 0 ? "#EF4444" : "#6B7280", fontWeight: 600 }}>
                        {group.stats.failed}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        color: parseFloat(group.stats.successRate) >= 90 ? "#10B981" :
                               parseFloat(group.stats.successRate) >= 70 ? "#F59E0B" : "#EF4444",
                        fontWeight: 600,
                      }}>
                        {group.stats.successRate}%
                      </span>
                    </td>
                    <td>{group.uniqueParticipants?.length || 0}</td>
                    <td>
                      <Link to={`/heartbeat-group/${new Date(group.mondayMidnight).toISOString().split('T')[0]}`} className={styles.ritualLink}>
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
                {groups.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--text-secondary)" }}>No heartbeat groups found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Heartbeats;
