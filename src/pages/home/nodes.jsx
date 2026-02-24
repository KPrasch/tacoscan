import React, { useState, useEffect, useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import * as Data from "../data";
import styles from "./nodes.module.css";
import CopyButton from "../../components/CopyButton";
import Loader from "../../components/loader";
import { Tooltip } from "../../components/ui";

const STATUS_COLORS = {
  Active: "#22c55e",
  Released: "#6b7280",
  Slashed: "#ef4444",
  Penalized: "#f59e0b",
  Beta: "#3b82f6",
};

const SortIcon = ({ active, direction }) => (
  <span style={{ marginLeft: 4, opacity: active ? 1 : 0.3, fontSize: "0.65rem" }}>
    {active && direction === "asc" ? "▲" : "▼"}
  </span>
);

const NodesPage = ({ network = "polygon", isSearch = false, searchInput = "" } = {}) => {
  const [allNodes, setAllNodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [sortKey, setSortKey] = useState("authorizedAmount");
  const [sortDir, setSortDir] = useState("desc");
  const [showDataStakers, setShowDataStakers] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);

  useEffect(() => {
    setIsLoading(true);
    Data.getNodes(isSearch, searchInput).then(async (info) => {
      const { nodes, statsRecord } = await Data.formatNodes(info?.appAuthorizations || []);
      setAllNodes(nodes);
      setStats(statsRecord);
      setIsLoading(false);
    }).catch(() => {
      setAllNodes([]);
      setStats({ numBondedOperators: 0, totalAuthorizedAmount: 0, totalStaked: 0 });
      setIsLoading(false);
    });
  }, [isSearch, searchInput]);

  const regularNodes = useMemo(() => allNodes.filter((n) => !n.isBetaStaker), [allNodes]);
  const dataStakers = useMemo(() => allNodes.filter((n) => n.isBetaStaker), [allNodes]);

  const displayNodes = useMemo(() => {
    const nodes = [...regularNodes];
    return nodes;
  }, [regularNodes]);

  const sorted = useMemo(() => {
    const arr = [...displayNodes];
    arr.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (typeof av === "string") av = av?.toLowerCase() || "";
      if (typeof bv === "string") bv = bv?.toLowerCase() || "";
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [displayNodes, sortKey, sortDir]);

  const sortedDataStakers = useMemo(() => {
    const arr = [...dataStakers];
    arr.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (typeof av === "string") av = av?.toLowerCase() || "";
      if (typeof bv === "string") bv = bv?.toLowerCase() || "";
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [dataStakers, sortKey, sortDir]);

  const paged = sorted.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  const totalPages = Math.ceil(sorted.length / rowsPerPage);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
    setPage(0);
  };

  const copyToClipBoard = (data) => {
    try { navigator.clipboard.writeText(data); } catch (e) {}
  };

  const activeCount = regularNodes.filter((n) => n.nodeStatus === "Active" && n.isOperatorConfirmed).length;
  const releasedCount = regularNodes.filter((n) => n.nodeStatus === "Released" || n.isReleased).length;

  const columns = [
    { key: "id", label: "Address", sortable: true },
    { key: "registeredOperatorAddress", label: "Operator", sortable: true },
    { key: "authorizedAmount", label: "Authorized Stake", sortable: true },
    { key: "nodeStatus", label: "Status", sortable: true },
    { key: "isOperatorConfirmed", label: "Confirmed", sortable: true },
    { key: "bondedAt", label: "Bonded", sortable: true },
  ];

  const StatusBadge = ({ status, isBeta }) => {
    if (isBeta) return <span className={styles.badge} style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6" }}>DATA</span>;
    const color = STATUS_COLORS[status] || "#6b7280";
    return <span className={styles.badge} style={{ background: `${color}20`, color }}>{status}</span>;
  };

  const renderRow = (node, idx) => (
    <tr key={node.id + idx} className={styles.row}>
      <td className={styles.cellAddr}>
        <RouterLink to={`/node/${node.id}`} className={styles.addrLink}>
          {node.id ? `${node.id.slice(0, 8)}…${node.id.slice(-6)}` : "—"}
        </RouterLink>
        <CopyButton onClick={() => copyToClipBoard(node.id)} />
      </td>
      <td className={styles.cellAddr}>
        {node.registeredOperatorAddress ? (
          <>
            <RouterLink to={`/node/${node.id}`} className={styles.addrLink}>
              {`${node.registeredOperatorAddress.slice(0, 8)}…${node.registeredOperatorAddress.slice(-6)}`}
            </RouterLink>
            <CopyButton onClick={() => copyToClipBoard(node.registeredOperatorAddress)} />
          </>
        ) : <span className={styles.muted}>—</span>}
      </td>
      <td className={styles.cellNum}>{Data.formatWeiDecimal(node.authorizedAmount)} <span className={styles.unit}>T</span></td>
      <td>
        <StatusBadge status={node.nodeStatus} isBeta={node.isBetaStaker} />
      </td>
      <td style={{ textAlign: "center" }}>
        {node.isOperatorConfirmed ? <span style={{ color: "#22c55e" }}>✓</span> : <span style={{ color: "#ef4444" }}>✗</span>}
      </td>
      <td className={styles.cellMuted}>{node.bondedAt ? Data.formatTimeToText(node.bondedAt) : "—"}</td>
    </tr>
  );

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        {/* Header Stats Bar */}
        <div className={styles.headerBar}>
          <h1 className={styles.title}>Nodes</h1>
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Total</span>
              <span className={styles.statValue}>{isLoading ? "…" : regularNodes.length}</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statLabel}>Active</span>
              <span className={styles.statValue} style={{ color: "#22c55e" }}>{isLoading ? "…" : activeCount}</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statLabel}>Released</span>
              <span className={styles.statValue} style={{ color: "#6b7280" }}>{isLoading ? "…" : releasedCount}</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statLabel}>Confirmed</span>
              <span className={styles.statValue}>{isLoading ? "…" : stats?.numBondedOperators || 0}</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statLabel}>Authorized</span>
              <span className={styles.statValue}>{isLoading ? "…" : Data.formatWeiDecimalNoSurplus(stats?.totalAuthorizedAmount || 0)} <span className={styles.unit}>T</span></span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <Loader />
        ) : (
          <>
            {/* Main Table */}
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className={styles.th}
                        onClick={col.sortable ? () => handleSort(col.key) : undefined}
                        style={{ cursor: col.sortable ? "pointer" : "default" }}
                      >
                        {col.label}
                        {col.sortable && <SortIcon active={sortKey === col.key} direction={sortDir} />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map(renderRow)}
                </tbody>
              </table>

              {sorted.length === 0 && <div className={styles.nodata}>No nodes found</div>}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button disabled={page === 0} onClick={() => setPage(page - 1)} className={styles.pageBtn}>← Prev</button>
                <span className={styles.pageInfo}>Page {page + 1} of {totalPages} · {sorted.length} nodes</span>
                <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className={styles.pageBtn}>Next →</button>
                <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }} className={styles.pageSelect}>
                  {[25, 50, 100, 250].map((n) => <option key={n} value={n}>{n}/page</option>)}
                </select>
              </div>
            )}

            {/* Data Stakers Toggle */}
            {dataStakers.length > 0 && (
              <div className={styles.dataStakerSection}>
                <button
                  className={styles.dataStakerToggle}
                  onClick={() => setShowDataStakers(!showDataStakers)}
                >
                  {showDataStakers ? "▾" : "▸"} Show data stakers ({dataStakers.length})
                </button>
                {showDataStakers && (
                  <div className={styles.tableWrap} style={{ marginTop: 8 }}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          {columns.map((col) => (
                            <th key={col.key} className={styles.th}>{col.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedDataStakers.map(renderRow)}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NodesPage;
