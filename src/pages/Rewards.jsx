import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getAllRewardEvents, formatString, formatTimeToText, formatWeiDecimal } from "./data";
import styles from "./Rewards.module.css";

const EVENT_COLORS = {
  REWARD_ADDED: "#10B981",
  REWARD_PAID: "#3B82F6",
  REWARDS_WITHDRAWN: "#F59E0B",
  REWARD_RESET: "#EF4444",
  REWARD_CONTRACT_SET: "#6366F1",
  REWARD_DISTRIBUTOR_SET: "#8B5CF6",
  COMMITMENT_MADE: "#06B6D4",
  PENALIZED: "#DC2626",
};

const Rewards = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    (async () => {
      try {
        const data = await getAllRewardEvents();
        setEvents(data);
      } catch (err) {
        console.error("Failed to fetch rewards:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const totalDistributed = events
      .filter(e => e.eventType === "REWARD_PAID" || e.eventType === "REWARD_ADDED")
      .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const totalWithdrawn = events
      .filter(e => e.eventType === "REWARDS_WITHDRAWN")
      .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const penalized = events.filter(e => e.eventType === "PENALIZED").length;

    // Top earners
    const earnerMap = {};
    events.filter(e => e.eventType === "REWARD_PAID" || e.eventType === "REWARD_ADDED").forEach(e => {
      if (e.stakingProvider) {
        earnerMap[e.stakingProvider] = (earnerMap[e.stakingProvider] || 0) + parseFloat(e.amount || 0);
      }
    });
    const topEarners = Object.entries(earnerMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { totalDistributed, totalWithdrawn, penalized, topEarners, totalEvents: events.length };
  }, [events]);

  const eventTypes = useMemo(() => [...new Set(events.map(e => e.eventType))].sort(), [events]);

  const filtered = useMemo(() => {
    return events.filter(ev => {
      if (filterType !== "all" && ev.eventType !== filterType) return false;
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        return [ev.stakingProvider, ev.transactionHash, ev.beneficiary, ev.sender]
          .filter(Boolean).some(v => v.toLowerCase().includes(s));
      }
      return true;
    });
  }, [events, filterType, searchTerm]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paged = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <div className={styles.networkActivity}><div className={styles.loading}>Loading reward events...</div></div>;

  return (
    <div className={styles.networkActivity}>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>💰 Rewards</h1>
            <p className={styles.pageSubtitle}>Network reward events — payouts, commitments, and penalties</p>
          </div>
          <div className={styles.headerStats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Events</span>
              <span className={styles.statValue}>{stats.totalEvents.toLocaleString()}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Distributed (wei)</span>
              <span className={styles.statValue}>{formatWeiDecimal(stats.totalDistributed.toString())}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Withdrawn (wei)</span>
              <span className={styles.statValue}>{formatWeiDecimal(stats.totalWithdrawn.toString())}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Penalties</span>
              <span className={styles.statValue}>{stats.penalized}</span>
            </div>
          </div>
        </div>

        {stats.topEarners.length > 0 && (
          <div className={styles.topEarners}>
            <h3 className={styles.sectionTitle}>Top Earners</h3>
            <div className={styles.earnersList}>
              {stats.topEarners.map(([addr, amount], i) => (
                <div key={addr} className={styles.earnerItem}>
                  <span className={styles.earnerRank}>#{i + 1}</span>
                  <Link to={`/node/${addr}`} className={styles.addressLink}>{formatString(addr)}</Link>
                  <span className={styles.earnerAmount}>{formatWeiDecimal(amount.toString())}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.filtersSection}>
          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="Search by address or tx hash..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.filterControls}>
            <select
              value={filterType}
              onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}
              className={styles.filterSelect}
            >
              <option value="all">All Types</option>
              {eventTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <span className={styles.tableInfo}>{filtered.length} reward events</span>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.activityTable}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Staking Provider</th>
                  <th>Amount</th>
                  <th>Beneficiary</th>
                  <th>Tx Hash</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((ev, idx) => (
                  <tr key={ev.id || idx}>
                    <td>
                      <span className={styles.eventType} style={{ background: `${EVENT_COLORS[ev.eventType] || "#6B7280"}20`, color: EVENT_COLORS[ev.eventType] || "#6B7280" }}>
                        {ev.eventType?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>
                      {ev.stakingProvider ? (
                        <Link to={`/node/${ev.stakingProvider}`} className={styles.addressLink}>
                          {formatString(ev.stakingProvider)}
                        </Link>
                      ) : "—"}
                    </td>
                    <td>{ev.amount && ev.amount !== "0" ? formatWeiDecimal(ev.amount) : "—"}</td>
                    <td>{ev.beneficiary ? formatString(ev.beneficiary) : "—"}</td>
                    <td>
                      <a
                        href={`https://etherscan.io/tx/${ev.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.txHash}
                      >
                        {formatString(ev.transactionHash)}
                      </a>
                    </td>
                    <td className={styles.timeAgo}>{formatTimeToText(ev.timestamp / 1000)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button className={styles.pageButton} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>← Prev</button>
              <div className={styles.pageNumbers}>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let page;
                  if (totalPages <= 7) page = i + 1;
                  else if (currentPage <= 4) page = i + 1;
                  else if (currentPage >= totalPages - 3) page = totalPages - 6 + i;
                  else page = currentPage - 3 + i;
                  return (
                    <button key={page} className={`${styles.pageButton} ${currentPage === page ? styles.active : ""}`} onClick={() => setCurrentPage(page)}>
                      {page}
                    </button>
                  );
                })}
              </div>
              <button className={styles.pageButton} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Rewards;
