import React, { useState, useEffect, useMemo } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import * as Data from "../data";
import styles from "./nodes.module.css";
import CopyButton from "../../components/CopyButton";
import { SkeletonRows } from "../../components/Skeleton";
import PageHeader from "../../components/PageHeader";

const STATUS_BADGE_CLASSES = {
  Active: "badgeActive",
  Released: "badgeReleased",
  Slashed: "badgeSlashed",
  Penalized: "badgePenalized",
  Data: "badgeData",
};

const StatusBadge = ({ status, isBeta }) => {
  if (isBeta) return <span className={`badge ${STATUS_BADGE_CLASSES.Data}`}>DATA</span>;
  const badgeClass = STATUS_BADGE_CLASSES[status] || STATUS_BADGE_CLASSES.Active;
  return <span className={`badge ${badgeClass}`}>{status || 'Active'}</span>;
};

const sortInd = (sortKey, key, sortDir) =>
  sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

const NodesPage = ({ network = "polygon", isSearch = false, searchInput = "" } = {}) => {
  const navigate = useNavigate();
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

  const renderRow = (node, idx) => (
    <tr
      key={node.id + idx}
      className={styles.row}
      onClick={() => navigate(`/node/${node.id}`)}
    >
      <td className={styles.cellAddr}>
        <RouterLink
          to={`/node/${node.id}`}
          className={styles.addrLink}
          onClick={(e) => e.stopPropagation()}
        >
          {node.id ? `${node.id.slice(0, 8)}…${node.id.slice(-6)}` : "—"}
        </RouterLink>
        <CopyButton onClick={(e) => { e.stopPropagation(); copyToClipBoard(node.id); }} />
      </td>
      <td className={styles.cellAddr}>
        {node.registeredOperatorAddress ? (
          <>
            <span className={styles.addrMono}>
              {`${node.registeredOperatorAddress.slice(0, 8)}…${node.registeredOperatorAddress.slice(-6)}`}
            </span>
            <CopyButton onClick={(e) => { e.stopPropagation(); copyToClipBoard(node.registeredOperatorAddress); }} />
          </>
        ) : <span className={styles.muted}>—</span>}
      </td>
      <td className={styles.cellNum}>{Data.formatWeiDecimal(node.authorizedAmount)} <span className={styles.unit}>T</span></td>
      <td>
        <StatusBadge status={node.nodeStatus} isBeta={node.isBetaStaker} />
      </td>
      <td className={styles.cellCenter}>
        {node.isOperatorConfirmed
          ? <span className={styles.confirmedYes}>Yes</span>
          : <span className={styles.confirmedNo}>No</span>}
      </td>
      <td className={styles.cellMuted}>{node.bondedAt ? Data.formatTimeToText(node.bondedAt) : "—"}</td>
    </tr>
  );

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        <PageHeader
          title="Nodes"
          subtitle="Staking providers authorized on the TACo network"
          stats={[
            { label: 'Total',      value: isLoading ? '…' : regularNodes.length },
            { label: 'Active',     value: isLoading ? '…' : activeCount },
            { label: 'Released',   value: isLoading ? '…' : releasedCount },
            { label: 'Confirmed',  value: isLoading ? '…' : (stats?.numBondedOperators || 0) },
            { label: 'Authorized', value: isLoading ? '…' : `${Data.formatWeiDecimalNoSurplus(stats?.totalAuthorizedAmount || 0)} T` },
          ]}
        />

        {/* Main Table */}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`${styles.th}${col.sortable ? ' ' + styles.sortable : ''}`}
                    onClick={col.sortable && !isLoading ? () => handleSort(col.key) : undefined}
                  >
                    {col.label}{col.sortable && !isLoading && sortInd(sortKey, col.key, sortDir)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? <SkeletonRows rows={12} cols={6} /> : paged.map(renderRow)}
            </tbody>
          </table>

          {!isLoading && sorted.length === 0 && <div className={styles.nodata}>No nodes found</div>}
        </div>

        {!isLoading && (
          <>

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
