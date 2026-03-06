import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  getAllNetworkEvents,
  formatTimeToText,
  formatString,
  formatWeiDecimal,
  formatDate,
} from "./data";
import styles from "./NetworkActivity.module.css";
import PageHeader from "../components/PageHeader";
import { ListSkeleton } from "../components/Skeleton";

// ── Category metadata ──────────────────────────────────────────────────────
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

const formatEventType = (type) => (type || "UNKNOWN").replace(/_/g, " ");

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

// ── Tab definitions ────────────────────────────────────────────────────────
const TABS = [
  { id: "all",            label: "All Events",      categories: null },
  { id: "ritual",         label: "DKG Rituals",     categories: ["ritual"] },
  { id: "authorization",  label: "Authorization",   categories: ["authorization"] },
  { id: "reward",         label: "Rewards",          categories: ["reward"] },
  { id: "infraction",     label: "Infractions",      categories: ["infraction"] },
  { id: "bridge",         label: "Bridge",           categories: ["bridge"] },
  { id: "governance",     label: "Governance",       categories: ["governance"] },
  { id: "reimbursement",  label: "Reimbursements",   categories: ["reimbursement"] },
  { id: "subscription",   label: "Subscriptions",    categories: ["subscription", "policy"] },
  { id: "signing",        label: "Signing",          categories: ["signing"] },
  { id: "access_control", label: "Access Control",   categories: ["access_control"] },
  { id: "handover",       label: "Handover",         categories: ["handover"] },
];

const TAG_STYLE = {
  display: "inline-block",
  padding: "1px 5px",
  borderRadius: "3px",
  border: "1px solid",
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.4px",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  fontFamily: "var(--font-mono)",
  opacity: 0.9,
};

// ── Chain badge component ──────────────────────────────────────────────────
const ChainBadge = ({ chain }) => (
  <span style={{ ...TAG_STYLE, color: CHAIN_COLORS[chain] || "#6B7280", borderColor: CHAIN_COLORS[chain] || "#6B7280" }}>
    {CHAIN_LABELS[chain] || chain}
  </span>
);

// ── Category badge component ───────────────────────────────────────────────
const CategoryBadge = ({ category }) => {
  const meta = CATEGORY_META[category] || { label: category, color: "var(--text-secondary)" };
  return (
    <span style={{ ...TAG_STYLE, color: meta.color, borderColor: meta.color }}>
      {meta.label}
    </span>
  );
};

// ── Bridge Messages table ──────────────────────────────────────────────────
const BridgeTable = ({ events }) => (
  <table className={styles.activityTable}>
    <thead>
      <tr>
        <th>Chain</th>
        <th>Message Type</th>
        <th>Domain</th>
        <th>Staking Provider</th>
        <th>Time</th>
        <th>Tx Hash</th>
        <th>Block</th>
      </tr>
    </thead>
    <tbody>
      {events.map((ev, idx) => (
        <tr key={`bridge-${idx}`}>
          <td><ChainBadge chain={ev.chain} /></td>
          <td><span className={styles.eventType}>{formatEventType(ev.messageType || ev.type)}</span></td>
          <td className={styles.timeAgo}>{ev.domain || "-"}</td>
          <td>
            {ev.stakingProvider ? (
              <Link to={`/node/${ev.stakingProvider}`} className={styles.addressLink}>
                {formatString(ev.stakingProvider)}
              </Link>
            ) : "-"}
          </td>
          <td className={styles.timeAgo}>{formatTimeToText(ev.timestamp)}</td>
          <td><span className={styles.txHash}>{ev.txHash ? formatString(ev.txHash) : "-"}</span></td>
          <td className={styles.blockNumber}>{ev.blockNumber || "-"}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

// ── Governance table ───────────────────────────────────────────────────────
const GovernanceTable = ({ events }) => (
  <table className={styles.activityTable}>
    <thead>
      <tr>
        <th>Chain</th>
        <th>Event Type</th>
        <th>Contract</th>
        <th>Old Value</th>
        <th>New Value</th>
        <th>Domain</th>
        <th>Time</th>
        <th>Tx Hash</th>
      </tr>
    </thead>
    <tbody>
      {events.map((ev, idx) => (
        <tr key={`gov-${idx}`}>
          <td><ChainBadge chain={ev.chain} /></td>
          <td><span className={styles.eventType}>{formatEventType(ev.type)}</span></td>
          <td><span className={styles.addressLink}>{ev.contract ? formatString(ev.contract) : "-"}</span></td>
          <td className={styles.timeAgo}>
            {ev.oldValueInt ?? (ev.oldValue ? formatString(ev.oldValue) : "-")}
          </td>
          <td className={styles.timeAgo}>
            {ev.newValueInt ?? (ev.newValue ? formatString(ev.newValue) : "-")}
          </td>
          <td className={styles.timeAgo}>{ev.domain || "-"}</td>
          <td className={styles.timeAgo}>{formatTimeToText(ev.timestamp)}</td>
          <td><span className={styles.txHash}>{ev.txHash ? formatString(ev.txHash) : "-"}</span></td>
        </tr>
      ))}
    </tbody>
  </table>
);

// ── Reimbursements table ───────────────────────────────────────────────────
const ReimbursementsTable = ({ events }) => (
  <table className={styles.activityTable}>
    <thead>
      <tr>
        <th>Chain</th>
        <th>Type</th>
        <th>Recipient</th>
        <th>Amount</th>
        <th>Time</th>
        <th>Tx Hash</th>
        <th>Block</th>
      </tr>
    </thead>
    <tbody>
      {events.map((ev, idx) => (
        <tr key={`reimb-${idx}`}>
          <td><ChainBadge chain={ev.chain} /></td>
          <td>
            <span className={styles.eventType} style={
              ev.type === "REIMBURSEMENT_FAILURE"
                ? { background: "rgba(239,68,68,0.1)", color: "#EF4444" }
                : {}
            }>
              {ev.type === "REIMBURSEMENT_WITHDRAWAL" ? "Withdrawal" : "Failure"}
            </span>
          </td>
          <td>
            {ev.recipient ? (
              <Link to={`/node/${ev.recipient}`} className={styles.addressLink}>
                {formatString(ev.recipient)}
              </Link>
            ) : "-"}
          </td>
          <td className={styles.amount}>{ev.amount ? formatWeiDecimal(ev.amount) + " T" : "-"}</td>
          <td className={styles.timeAgo}>{formatTimeToText(ev.timestamp)}</td>
          <td><span className={styles.txHash}>{ev.txHash ? formatString(ev.txHash) : "-"}</span></td>
          <td className={styles.blockNumber}>{ev.blockNumber || "-"}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

// ── Subscriptions table ────────────────────────────────────────────────────
const SubscriptionsTable = ({ events }) => (
  <table className={styles.activityTable}>
    <thead>
      <tr>
        <th>Chain</th>
        <th>Type</th>
        <th>Subscriber / Sponsor</th>
        <th>Amount</th>
        <th>Ritual / Policy</th>
        <th>Period</th>
        <th>Time</th>
        <th>Tx Hash</th>
      </tr>
    </thead>
    <tbody>
      {events.map((ev, idx) => (
        <tr key={`sub-${idx}`}>
          <td><ChainBadge chain={ev.chain} /></td>
          <td>
            <span className={styles.eventType}>
              {ev.category === "policy" ? "Policy Created" : formatEventType(ev.type)}
            </span>
          </td>
          <td>
            <span className={styles.addressLink}>
              {formatString(ev.subscriber || ev.sponsor || ev.owner || "-")}
            </span>
          </td>
          <td className={styles.amount}>
            {ev.amount ? formatWeiDecimal(ev.amount) + " T" : ev.cost ? formatWeiDecimal(ev.cost) + " T" : "-"}
          </td>
          <td>
            {ev.policyId ? (
              <span className={styles.addressLink}>Policy #{ev.policyId}</span>
            ) : ev.ritualId ? (
              <Link to={`/ritual/${ev.ritualId}`} className={styles.addressLink}>Ritual #{ev.ritualId}</Link>
            ) : "-"}
          </td>
          <td className={styles.timeAgo}>{ev.period || ev.slots || "-"}</td>
          <td className={styles.timeAgo}>{formatTimeToText(ev.timestamp)}</td>
          <td><span className={styles.txHash}>{ev.txHash ? formatString(ev.txHash) : "-"}</span></td>
        </tr>
      ))}
    </tbody>
  </table>
);

// ── Generic "All Events" table (original) ──────────────────────────────────
const AllEventsTable = ({ events }) => (
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
      {events.map((ev, idx) => {
        const addrInfo = getEventAddress(ev);
        return (
          <tr key={`all-${ev.chain}-${ev.timestamp}-${idx}`}>
            <td><ChainBadge chain={ev.chain} /></td>
            <td><CategoryBadge category={ev.category} /></td>
            <td><span className={styles.eventType}>{formatEventType(ev.type)}</span></td>
            <td className={styles.timeAgo}>{formatTimeToText(ev.timestamp)}</td>
            <td>
              {addrInfo ? (
                addrInfo.link ? (
                  <Link to={addrInfo.link} className={styles.addressLink}>
                    {addrInfo.addr.startsWith("0x") ? formatString(addrInfo.addr) : addrInfo.addr}
                  </Link>
                ) : (
                  <span className={styles.addressLink}>
                    {addrInfo.addr.startsWith("0x") ? formatString(addrInfo.addr) : addrInfo.addr}
                  </span>
                )
              ) : "-"}
            </td>
            <td className={styles.amount}>{ev.amount ? formatWeiDecimal(ev.amount) + " T" : "-"}</td>
            <td><span className={styles.txHash}>{ev.txHash ? formatString(ev.txHash) : "-"}</span></td>
            <td className={styles.blockNumber}>{ev.blockNumber || "-"}</td>
          </tr>
        );
      })}
    </tbody>
  </table>
);

// ── Table renderer per tab ─────────────────────────────────────────────────
const TABLE_COMPONENTS = {
  all: AllEventsTable,
  ritual: AllEventsTable,
  authorization: AllEventsTable,
  reward: AllEventsTable,
  infraction: AllEventsTable,
  bridge: BridgeTable,
  governance: GovernanceTable,
  reimbursement: ReimbursementsTable,
  subscription: SubscriptionsTable,
  signing: AllEventsTable,
  access_control: AllEventsTable,
  handover: AllEventsTable,
};

// ════════════════════════════════════════════════════════════════════════════
// Main component
// ════════════════════════════════════════════════════════════════════════════
const NetworkActivity = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterChain, setFilterChain] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

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

  // Filter by active tab categories
  const tabDef = TABS.find(t => t.id === activeTab);
  const tabCategories = tabDef?.categories;

  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      if (tabCategories && !tabCategories.includes(ev.category)) return false;
      if (filterChain !== "all" && ev.chain !== filterChain) return false;
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        const searchable = [
          ev.type, ev.txHash, ev.stakingProvider, ev.participant,
          ev.ritualId?.toString(), ev.subscriber, ev.recipient,
          ev.sender, ev.signer, ev.operator, ev.authority,
          ev.contract, ev.domain,
        ].filter(Boolean).map(v => v.toLowerCase());
        if (!searchable.some(v => v.includes(s))) return false;
      }
      return true;
    });
  }, [events, tabCategories, filterChain, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const pageEvents = filteredEvents.slice(startIdx, startIdx + itemsPerPage);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts = {};
    TABS.forEach(tab => {
      if (!tab.categories) {
        counts[tab.id] = events.length;
      } else {
        counts[tab.id] = events.filter(e => tab.categories.includes(e.category)).length;
      }
    });
    return counts;
  }, [events]);

  // 24h stats
  const stats24h = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return events.filter(e => e.timestamp > cutoff).length;
  }, [events]);

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [activeTab, filterChain, searchTerm]);

  if (loading) {
    return (
      <ListSkeleton cols={6} rows={12} />
    );
  }

  const TableComponent = TABLE_COMPONENTS[activeTab] || AllEventsTable;

  return (
    <div className={styles.networkActivity}>
      <div className={styles.container}>
        <PageHeader
          title="Protocol"
          subtitle="TACo protocol events across Ethereum, Polygon &amp; Base — bridge messages, governance, reimbursements &amp; subscriptions"
          stats={[
            { label: 'Total Events', value: events.length.toLocaleString() },
            { label: '24h Activity', value: stats24h },
            { label: 'Chains', value: 3 },
          ]}
        />

        {/* Tabs */}
        <div className={styles.tabNav}>
          {TABS.filter(tab => !tab.categories || (tabCounts[tab.id] || 0) > 0).map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className={styles.tabLabel}>{tab.label}</span>
              <span className={styles.tabCount}>{tabCounts[tab.id]?.toLocaleString() || 0}</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className={styles.filtersSection}>
          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="Search by address, tx hash, event type, domain..."
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
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <div className={styles.tableInfo}>
              <span>
                Showing {filteredEvents.length > 0 ? startIdx + 1 : 0} to{" "}
                {Math.min(startIdx + itemsPerPage, filteredEvents.length)} of{" "}
                {filteredEvents.length.toLocaleString()} events
              </span>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            {pageEvents.length > 0 ? (
              <TableComponent events={pageEvents} />
            ) : (
              <div className={styles.emptyState}>
                No {tabDef?.label || "events"} found{filterChain !== "all" ? ` on ${filterChain}` : ""}{searchTerm ? ` matching "${searchTerm}"` : ""}.
              </div>
            )}
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
