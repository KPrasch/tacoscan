import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getRituals, detectHeartbeatGroups, formatRitualsData, formatString, formatTimeToText, getTimeout, getLiveRitualIds } from "./data";
import styles from "./Heartbeats.module.css";

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

  // Build heatmap data — daily heartbeat counts for last 52 weeks
  const heatmapData = useMemo(() => {
    const dayMap = {};
    allHeartbeats.forEach(r => {
      const ts = r.initTimeStamp || r.startedAt;
      if (!ts) return;
      const d = new Date(ts);
      const key = d.toISOString().split('T')[0];
      if (!dayMap[key]) dayMap[key] = { total: 0, successful: 0, failed: 0 };
      dayMap[key].total++;
      if (r.status === "SUCCESSFUL" || r.status === "ACTIVE") dayMap[key].successful++;
      else dayMap[key].failed++;
    });

    // Generate 52 weeks of days ending today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = [];
    // Start from the Sunday 52 weeks ago
    const start = new Date(today);
    start.setDate(start.getDate() - start.getDay() - 52 * 7);
    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0];
      days.push({ date: key, ...( dayMap[key] || { total: 0, successful: 0, failed: 0 }) });
    }
    return days;
  }, [allHeartbeats]);

  const maxCount = useMemo(() => Math.max(1, ...heatmapData.map(d => d.total)), [heatmapData]);

  const getHeatColor = (count, failed) => {
    if (count === 0) return '#F3F4F6';
    if (failed > 0) {
      const ratio = failed / count;
      if (ratio > 0.5) return '#FCA5A5';
      if (ratio > 0.2) return '#FBBF24';
    }
    const intensity = Math.min(count / maxCount, 1);
    if (intensity < 0.25) return '#D1FAE5';
    if (intensity < 0.5) return '#6EE7B7';
    if (intensity < 0.75) return '#34D399';
    return '#059669';
  };

  if (loading) return <div className={styles.networkActivity}><div className={styles.loading}>Loading heartbeat data...</div></div>;

  // Group heatmap into weeks (columns)
  const weeks = [];
  for (let i = 0; i < heatmapData.length; i += 7) {
    weeks.push(heatmapData.slice(i, i + 7));
  }

  return (
    <div className={styles.networkActivity}>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>Heartbeats</h1>
            <p className={styles.pageSubtitle}>
              Weekly liveness checks — small DKG rituals (≤3 participants) that verify node availability.
              Distinct from full DKG key generation ceremonies.
            </p>
          </div>
          <div className={styles.headerStats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Weekly Groups</span>
              <span className={styles.statValue}>{stats.totalGroups}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Rituals</span>
              <span className={styles.statValue}>{stats.totalRituals}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Success Rate</span>
              <span className={styles.statValue}>{stats.successRate}%</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Participants</span>
              <span className={styles.statValue}>{stats.uniqueParticipants}</span>
            </div>
          </div>
        </div>

        {/* Heartbeat Heatmap */}
        <div className={styles.heatmapSection}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
            HEARTBEAT ACTIVITY — LAST 52 WEEKS
          </h3>
          <div className={styles.heatmapLegend}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Less</span>
            {['#F3F4F6', '#D1FAE5', '#6EE7B7', '#34D399', '#059669'].map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, background: c, borderRadius: 1 }} />
            ))}
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>More</span>
            <div style={{ width: 10, height: 10, background: '#FCA5A5', borderRadius: 1, marginLeft: 8 }} />
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Failures</span>
          </div>
          <div className={styles.heatmapGrid}>
            {weeks.map((week, wi) => (
              <div key={wi} className={styles.heatmapCol}>
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={styles.heatmapCell}
                    style={{ background: getHeatColor(day.total, day.failed) }}
                    title={`${day.date}: ${day.total} heartbeats (${day.successful} ok, ${day.failed} failed)`}
                  />
                ))}
              </div>
            ))}
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
                      <span className={styles.eventType} style={{ background: "#10B98120", color: "#10B981" }}>
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
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#6B7280" }}>No heartbeat groups found</td></tr>
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
