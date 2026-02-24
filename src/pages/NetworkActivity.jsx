import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  getAllNetworkEvents,
  formatTimeToText,
  formatString,
  formatWeiDecimal,
} from "./data";
import styles from "./NetworkActivity.module.css";

// ── Category metadata for display ──────────────────────────────────────────
const CATEGORY_META = {
  authorization: { label: "Authorization", color: "#3B82F6" },
  reward:        { label: "Reward",        color: "#F59E0B" },
  ritual:        { label: "Ritual",        color: "#8B5CF6" },
  handover:      { label: "Handover",      color: "#EC4899" },
  governance:    { label: "Governance",    color: "#EF4444" },
  bridge:        { label: "Bridge",        color: "#06B6D4" },
  infraction:    { label: "Infraction",    color: "#DC2626" },
  subscription:  { label: "Subscription",  color: "#10B981" },
  policy:        { label: "Policy",        color: "#14B8A6" },
  access_control:{ label: "Access Ctrl",   color: "#6366F1" },
  reimbursement: { label: "Reimbursement", color: "#78716C" },
  signing:       { label: "Signing",       color: "#A855F7" },
  multisig:      { label: "Multisig",      color: "#D946EF" },
  op_execution:  { label: "OP Execution",  color: "#0EA5E9" },
  contract_auth: { label: "Contract Auth", color: "#64748B" },
};

const CHAIN_LABELS = { ethereum: "ETH", polygon: "POLY", base: "BASE" };
const CHAIN_COLORS = { ethereum: "#627EEA", polygon: "#8247E5", base: "#0052FF" };

const formatEventType = (type) =>
  (type || "UNKNOWN").replace(/_/g, " ");

// Get the most relevant address to display for an event
const getEventAddress = (event) => {
  if (event.stakingProvider) return { addr: event.stakingProvider, link: `/node/${event.stakingProvider}` };
  if (event.ritualId) return { addr: `Ritual #${event.ritualId}`, link: `/ritual/${event.ritualId}` };
  if (event.participant) return { addr: event.participant, link: null };
  if (event.subscriber) return { addr: event.subscriber, link: null };
  if (event.recipient) return { addr: event.recipient, link: null };
  if (event.sender) return { addr: event.sender, link: null };
  if (event.signer) return { addr: event.signer, link: null };
  if (event.operator) return { addr: event.operator, link: null };
  if (event.authority) return { addr: event.authority, link: null };
  if (event.target) return { addr: event.target, link: null };
  if (event.multisigAddress) return { addr: event.multisigAddress, link: null };
  if (event.provider) return { addr: event.provider, link: null };
  return null;
};

const NetworkActivity = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterChain, setFilterChain] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);

  useEffect(() => {
    (async () => {
      try {
        const allEvents = await getAllNetworkEvents();
        setEvents(allEvents);
      } catch (err) {
        console.error("Failed to fetch network activity:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Derive available categories from actual data
  const availableCategories = useMemo(() => {
    const cats = new Set(events.map(e => e.category));
    return [...cats].sort();
  }, [events]);

  // Filter
  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      if (filterCategory !== "all" && ev.category !== filterCategory) return false;
      if (filterChain !== "all" && ev.chain !== filterChain) return false;
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        const searchable = [
          ev.type, ev.txHash, ev.stakingProvider, ev.participant,
          ev.ritualId?.toString(), ev.subscriber, ev.recipient,
          ev.sender, ev.signer, ev.operator, ev.authority,
        ].filter(Boolean).map(v => v.toLowerCase());
        if (!searchable.some(v => v.includes(s))) return false;
      }
      return true;
    });
  }, [events, filterCategory, filterChain, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const pageEvents = filteredEvents.slice(startIdx, startIdx + itemsPerPage);

  // Stats
  const stats24h = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return events.filter(e => e.timestamp > cutoff).length;
  }, [events]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [filterCategory, filterChain, searchTerm]);

  if (loading) {
    return (
      <div className={styles.networkActivity}>
        <div className={styles.container}>
          <div className={styles.loading}>Loading network activity from all chains...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.networkActivity}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>Network Activity</h1>
            <p className={styles.pageSubtitle}>
              All TACo protocol events across Ethereum, Polygon &amp; Base
            </p>
          </div>
          <div className={styles.headerStats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Events</span>
              <span className={styles.statValue}>{events.length.toLocaleString()}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>24h Activity</span>
              <span className={styles.statValue}>{stats24h}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Categories</span>
              <span className={styles.statValue}>{availableCategories.length}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filtersSection}>
          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="Search by address, tx hash, event type, ritual ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.filterControls}>
            <select
              value={filterChain}
              onChange={e => setFilterChain(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Chains</option>
              <option value="ethereum">Ethereum</option>
              <option value="polygon">Polygon</option>
              <option value="base">Base</option>
            </select>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Categories</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>
                  {CATEGORY_META[cat]?.label || cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <div className={styles.tableInfo}>
              <span>
                Showing {startIdx + 1} to {Math.min(startIdx + itemsPerPage, filteredEvents.length)} of{" "}
                {filteredEvents.length.toLocaleString()} events
              </span>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.activityTable}>
              <thead>
                <tr>
                  <th>Chain</th>
                  <th>Category</th>
                  <th>Event</th>
                  <th>Time</th>
                  <th>Address</th>
                  <th>Amount</th>
                  <th>Tx Hash</th>
                  <th>Block</th>
                </tr>
              </thead>
              <tbody>
                {pageEvents.map((ev, idx) => {
                  const addrInfo = getEventAddress(ev);
                  const catMeta = CATEGORY_META[ev.category] || { label: ev.category, color: "#6B7280" };
                  return (
                    <tr key={`${ev.chain}-${ev.timestamp}-${idx}`}>
                      <td>
                        <span
                          style={{
                            background: CHAIN_COLORS[ev.chain] || "#6B7280",
                            color: "#fff",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "10px",
                            fontWeight: 700,
                          }}
                        >
                          {CHAIN_LABELS[ev.chain] || ev.chain}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            background: `${catMeta.color}18`,
                            color: catMeta.color,
                            padding: "3px 7px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {catMeta.label}
                        </span>
                      </td>
                      <td>
                        <span className={styles.eventType}>
                          {formatEventType(ev.type)}
                        </span>
                      </td>
                      <td className={styles.timeAgo}>
                        {formatTimeToText(ev.timestamp)}
                      </td>
                      <td>
                        {addrInfo ? (
                          addrInfo.link ? (
                            <Link to={addrInfo.link} className={styles.link || styles.addressLink}>
                              {addrInfo.addr.startsWith("0x")
                                ? formatString(addrInfo.addr)
                                : addrInfo.addr}
                            </Link>
                          ) : (
                            <span className={styles.addressLink}>
                              {addrInfo.addr.startsWith("0x")
                                ? formatString(addrInfo.addr)
                                : addrInfo.addr}
                            </span>
                          )
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className={styles.amount}>
                        {ev.amount ? formatWeiDecimal(ev.amount) + " T" : "-"}
                      </td>
                      <td>
                        <span className={styles.txHash}>
                          {ev.txHash ? formatString(ev.txHash) : "-"}
                        </span>
                      </td>
                      <td className={styles.blockNumber}>
                        {ev.blockNumber || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={styles.pageButton}
              >
                Previous
              </button>
              <div className={styles.pageNumbers}>
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 6, currentPage - 3)) + i;
                  if (pageNum > totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`${styles.pageButton} ${pageNum === currentPage ? styles.active : ""}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={styles.pageButton}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkActivity;
