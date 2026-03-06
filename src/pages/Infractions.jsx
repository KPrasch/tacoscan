import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getAllInfractions, formatString, formatTimeToText } from "./data";
import styles from "./Infractions.module.css";
import PageHeader from "../components/PageHeader";
import { ListSkeleton } from "../components/Skeleton";

const CHAIN_COLORS = { ethereum: "#627EEA", polygon: "#8247E5" };

const Infractions = () => {
  const [infractions, setInfractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [filterChain, setFilterChain] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    (async () => {
      try {
        const data = await getAllInfractions();
        setInfractions(data);
      } catch (err) {
        console.error("Failed to fetch infractions:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const offenderMap = {};
    infractions.forEach(i => {
      if (i.stakingProvider) {
        offenderMap[i.stakingProvider] = (offenderMap[i.stakingProvider] || 0) + 1;
      }
    });
    const repeatOffenders = Object.entries(offenderMap).filter(([, c]) => c > 1).length;
    const topOffenders = Object.entries(offenderMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const typeBreakdown = {};
    infractions.forEach(i => {
      const t = i.infractionTypeName || `Type ${i.infractionType}`;
      typeBreakdown[t] = (typeBreakdown[t] || 0) + 1;
    });
    return { total: infractions.length, repeatOffenders, topOffenders, typeBreakdown };
  }, [infractions]);

  const infractionTypes = useMemo(() => [...new Set(infractions.map(i => i.infractionTypeName || `Type ${i.infractionType}`))].sort(), [infractions]);

  const filtered = useMemo(() => {
    return infractions.filter(ev => {
      if (filterType !== "all" && (ev.infractionTypeName || `Type ${ev.infractionType}`) !== filterType) return false;
      if (filterChain !== "all" && ev.chain !== filterChain) return false;
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        return [ev.stakingProvider, ev.ritualId?.toString(), ev.id]
          .filter(Boolean).some(v => v.toLowerCase().includes(s));
      }
      return true;
    });
  }, [infractions, filterType, filterChain, searchTerm]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paged = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <ListSkeleton cols={6} rows={12} />;

  return (
    <div className={styles.networkActivity}>
      <div className={styles.container}>
        <PageHeader
          title="Infractions"
          subtitle="Network infractions — missed transcripts, aggregations, and penalties"
          stats={[
            { label: 'Total', value: stats.total.toLocaleString() },
            { label: 'Repeat Offenders', value: stats.repeatOffenders },
            ...Object.entries(stats.typeBreakdown).slice(0, 3).map(([type, count]) => ({
              label: type.replace(/_/g, ' '),
              value: count,
            })),
          ]}
        />

        {stats.topOffenders.length > 0 && (
          <div className={styles.topEarners}>
            <h3 className={styles.sectionTitle}>Top Offenders</h3>
            <div className={styles.earnersList}>
              {stats.topOffenders.map(([addr, count], i) => (
                <div key={addr} className={styles.earnerItem}>
                  <span className={styles.earnerRank}>#{i + 1}</span>
                  <Link to={`/node/${addr}`} className={styles.addressLink}>{formatString(addr)}</Link>
                  <span className={styles.earnerAmount}>{count} infractions</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.filtersSection}>
          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="Search by address or ritual ID..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.filterControls}>
            <select value={filterType} onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }} className={styles.filterSelect}>
              <option value="all">All Types</option>
              {infractionTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select>
            <select value={filterChain} onChange={e => { setFilterChain(e.target.value); setCurrentPage(1); }} className={styles.filterSelect}>
              <option value="all">All Chains</option>
              <option value="ethereum">Ethereum</option>
              <option value="polygon">Polygon</option>
            </select>
          </div>
        </div>

        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <span className={styles.tableInfo}>{filtered.length} infractions</span>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.activityTable}>
              <thead>
                <tr>
                  <th>Chain</th>
                  <th>Type</th>
                  <th>Staking Provider</th>
                  <th>Ritual</th>
                  <th>Domain</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((ev, idx) => (
                  <tr key={ev.id || idx}>
                    <td>
                      <span className={styles.eventType} style={{ color: CHAIN_COLORS[ev.chain] || "#6B7280", borderColor: CHAIN_COLORS[ev.chain] || "#6B7280" }}>
                        {ev.chain?.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className={styles.eventType} style={{ color: "#DC2626", borderColor: "#DC2626" }}>
                        {(ev.infractionTypeName || `Type ${ev.infractionType}`).replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>
                      {ev.stakingProvider ? (
                        <Link to={`/node/${ev.stakingProvider}`} className={styles.addressLink}>{formatString(ev.stakingProvider)}</Link>
                      ) : "—"}
                    </td>
                    <td>
                      {ev.ritualId ? (
                        <Link to={`/ritual/${ev.ritualId}`} className={styles.ritualLink}>#{ev.ritualId}</Link>
                      ) : "—"}
                    </td>
                    <td>{ev.domain || "—"}</td>
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
                    <button key={page} className={`${styles.pageButton} ${currentPage === page ? styles.active : ""}`} onClick={() => setCurrentPage(page)}>{page}</button>
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

export default Infractions;
