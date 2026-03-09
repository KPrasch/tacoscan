import React, { useState, useEffect, useMemo } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import * as Data from "../data";
import styles from "./nodes.module.css";
import CopyButton from "../../components/CopyButton";
import { SkeletonRows } from "../../components/Skeleton";
import PageHeader from "../../components/PageHeader";

/* Consolidated status: merges nodeStatus + operator presence into one label */
const getConsolidatedStatus = (node) => {
  if (node.isSlashed) return 'Slashed';
  if (node.isPenalized) return 'Penalized';
  if (node.isReleased) return 'Released';
  if (!node.registeredOperatorAddress) return 'Inactive';
  return 'Active';
};

const STATUS_META = {
  Active:    { cls: 'statusActive',    dot: '#10b981' },
  Inactive:  { cls: 'statusInactive',  dot: '#6b7280' },
  Released:  { cls: 'statusReleased',  dot: '#6b7280' },
  Slashed:   { cls: 'statusSlashed',   dot: '#dc2626' },
  Penalized: { cls: 'statusPenalized', dot: '#dc2626' },
};

const StatusPill = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.Active;
  return (
    <span className={styles[meta.cls]}>
      <span className={styles.statusDot} style={{ background: meta.dot }} />
      {status}
    </span>
  );
};

const sortInd = (sortKey, key, sortDir) =>
  sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

const NodesPage = ({ network = "polygon", isSearch = false, searchInput = "" } = {}) => {
  const navigate = useNavigate();
  const [allNodes, setAllNodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState("asc");
  const [showDataStakers, setShowDataStakers] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [viewMode, setViewMode] = useState('grid');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    setIsLoading(true);
    Data.getNodes(isSearch, searchInput).then(async (info) => {
      const { nodes, statsRecord } = await Data.formatNodes(info?.appAuthorizations || []);
      // Enrich with consolidated status
      const enriched = nodes.map(n => ({ ...n, consolidatedStatus: getConsolidatedStatus(n) }));
      setAllNodes(enriched);
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

  const filteredNodes = useMemo(() => {
    if (statusFilter === 'all') return regularNodes;
    return regularNodes.filter(n => n.consolidatedStatus === statusFilter);
  }, [regularNodes, statusFilter]);

  const sorted = useMemo(() => {
    const arr = [...filteredNodes];
    arr.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (typeof av === "string") av = av?.toLowerCase() || "";
      if (typeof bv === "string") bv = bv?.toLowerCase() || "";
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filteredNodes, sortKey, sortDir]);

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

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = { Active: 0, Inactive: 0, Released: 0, Slashed: 0, Penalized: 0 };
    regularNodes.forEach(n => { counts[n.consolidatedStatus] = (counts[n.consolidatedStatus] || 0) + 1; });
    return counts;
  }, [regularNodes]);

  const columns = [
    { key: "id", label: "Address", sortable: true },
    { key: "registeredOperatorAddress", label: "Operator", sortable: true },
    { key: "consolidatedStatus", label: "Status", sortable: true },
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
      <td><StatusPill status={node.consolidatedStatus} /></td>
    </tr>
  );

  const renderCard = (node) => (
    <div
      key={node.id}
      className={styles.nodeCard}
      onClick={() => navigate(`/node/${node.id}`)}
    >
      <div className={styles.cardHeader}>
        <StatusPill status={node.consolidatedStatus} />
      </div>
      <div className={styles.cardAddr}>
        <RouterLink
          to={`/node/${node.id}`}
          className={styles.addrLink}
          onClick={(e) => e.stopPropagation()}
        >
          {node.id ? `${node.id.slice(0, 6)}…${node.id.slice(-4)}` : "—"}
        </RouterLink>
        <CopyButton onClick={(e) => { e.stopPropagation(); copyToClipBoard(node.id); }} />
      </div>
      {node.registeredOperatorAddress && (
        <div className={styles.cardOperator}>
          <span className={styles.cardLabel}>Operator</span>
          <span className={styles.addrMono}>
            {`${node.registeredOperatorAddress.slice(0, 6)}…${node.registeredOperatorAddress.slice(-4)}`}
          </span>
        </div>
      )}
    </div>
  );

  /* Filter button style */
  const filterBtn = (active) => ({
    padding: '4px 10px',
    background: active ? 'var(--accent-green)' : 'var(--bg-secondary)',
    color: active ? '#000000' : 'var(--text-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: active ? 600 : 500,
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
    transition: 'background 0.15s ease, color 0.15s ease',
    whiteSpace: 'nowrap',
  });

  const viewBtn = (active) => ({
    padding: '4px 8px',
    background: active ? 'var(--bg-surface)' : 'transparent',
    color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
    border: active ? '1px solid var(--border-color)' : '1px solid transparent',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: active ? 700 : 500,
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
  });

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        <PageHeader
          title="Nodes"
          subtitle="Operators powering the TACo network"
          stats={[
            { label: 'Total',    value: isLoading ? '…' : regularNodes.length },
            { label: 'Active',   value: isLoading ? '…' : statusCounts.Active },
            { label: 'Inactive', value: isLoading ? '…' : statusCounts.Inactive },
            { label: 'Released', value: isLoading ? '…' : statusCounts.Released },
          ]}
        />

        {/* Controls row */}
        <div className={styles.controlsRow}>
          <div className={styles.controlsLeft}>
            {/* Status filters */}
            <button onClick={() => { setStatusFilter('all'); setPage(0); }} style={filterBtn(statusFilter === 'all')}>
              All ({regularNodes.length})
            </button>
            <button onClick={() => { setStatusFilter('Active'); setPage(0); }} style={filterBtn(statusFilter === 'Active')}>
              Active ({statusCounts.Active})
            </button>
            <button onClick={() => { setStatusFilter('Inactive'); setPage(0); }} style={filterBtn(statusFilter === 'Inactive')}>
              Inactive ({statusCounts.Inactive})
            </button>
            {statusCounts.Released > 0 && (
              <button onClick={() => { setStatusFilter('Released'); setPage(0); }} style={filterBtn(statusFilter === 'Released')}>
                Released ({statusCounts.Released})
              </button>
            )}
          </div>
          <div className={styles.controlsRight}>
            <button onClick={() => setViewMode('table')} style={viewBtn(viewMode === 'table')}>Table</button>
            <button onClick={() => setViewMode('grid')} style={viewBtn(viewMode === 'grid')}>Grid</button>
          </div>
        </div>

        {/* Table view */}
        {viewMode === 'table' && (
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
                {isLoading ? <SkeletonRows rows={12} cols={3} /> : paged.map(renderRow)}
              </tbody>
            </table>
            {!isLoading && sorted.length === 0 && <div className={styles.nodata}>No nodes found</div>}
          </div>
        )}

        {/* Grid view */}
        {viewMode === 'grid' && (
          <div className={styles.nodeGrid}>
            {isLoading
              ? Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className={`${styles.nodeCard} ${styles.cardSkeleton}`}>
                    <div className={styles.skeletonLine} style={{ width: '60%' }} />
                    <div className={styles.skeletonLine} style={{ width: '80%' }} />
                    <div className={styles.skeletonLine} style={{ width: '40%' }} />
                  </div>
                ))
              : paged.map(renderCard)
            }
            {!isLoading && sorted.length === 0 && <div className={styles.nodata}>No nodes found</div>}
          </div>
        )}

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
                        {sortedDataStakers.map((node, idx) => renderRow({ ...node, consolidatedStatus: getConsolidatedStatus(node) }, idx))}
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
