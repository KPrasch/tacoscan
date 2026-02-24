import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getRituals, detectHeartbeatGroups, formatRitualsData, formatString, formatTimeToText, getTimeout } from "./data";
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
        const rituals = formatRitualsData(rawRituals, timeout);
        const heartbeatRituals = rituals.filter(r => r.isHeartbeat);
        setAllHeartbeats(heartbeatRituals);
        const detected = detectHeartbeatGroups(rituals, timeout);
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

  if (loading) return <div className={styles.networkActivity}><div className={styles.loading}>Loading heartbeat data...</div></div>;

  return (
    <div className={styles.networkActivity}>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>💓 Heartbeats</h1>
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
                  <tr key={idx} style={{ cursor: "pointer" }} onClick={() => navigate(`/heartbeat-group/${group.weekNumber}`)}>
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
                      <Link to={`/heartbeat-group/${group.weekNumber}`} className={styles.ritualLink}>
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
