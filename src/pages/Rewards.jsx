import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getRewardDistributions, formatString, formatWeiDecimal } from "./data";
import styles from "./Rewards.module.css";
import PageHeader from "../components/PageHeader";
import { ListSkeleton } from "../components/Skeleton";

const REWARDS_CONTRACT = "0xA08AadA7c59E4A1D4A858fcfA299673d2f6De0c3";

const formatTokenAmount = (weiStr) => {
  try {
    const bi = BigInt(weiStr);
    const whole = bi / BigInt(10 ** 18);
    const frac = bi % BigInt(10 ** 18);
    const fracStr = frac.toString().padStart(18, "0").slice(0, 2);
    return `${Number(whole).toLocaleString()}.${fracStr}`;
  } catch {
    return "0";
  }
};

const Rewards = () => {
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDist, setSelectedDist] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    (async () => {
      try {
        const data = await getRewardDistributions();
        setDistributions(data);
        if (data.length > 0) setSelectedDist(data[data.length - 1].date);
      } catch (err) {
        console.error("Failed to fetch distributions:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    if (!distributions.length) return { totalDistributed: "0", totalStakers: 0, distributions: 0 };
    const latest = distributions[distributions.length - 1];
    const totalStakers = Object.keys(latest.claims).length;
    return {
      totalDistributed: latest.accumulatedAmount,
      latestDistribution: latest.thisDistributionAmount,
      totalStakers,
      distributions: distributions.length,
    };
  }, [distributions]);

  const currentDist = useMemo(() => distributions.find(d => d.date === selectedDist), [distributions, selectedDist]);

  const claimsList = useMemo(() => {
    if (!currentDist) return [];
    return Object.entries(currentDist.claims)
      .map(([addr, claim]) => ({ address: addr, ...claim }))
      .sort((a, b) => {
        try { return BigInt(b.earnedThisDistribution) > BigInt(a.earnedThisDistribution) ? 1 : -1; } catch { return 0; }
      });
  }, [currentDist]);

  const filtered = useMemo(() => {
    if (!searchTerm) return claimsList;
    const s = searchTerm.toLowerCase();
    return claimsList.filter(c =>
      c.address.toLowerCase().includes(s) || c.beneficiary?.toLowerCase().includes(s)
    );
  }, [claimsList, searchTerm]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paged = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <ListSkeleton cols={5} rows={12} />;

  return (
    <div className={styles.networkActivity}>
      <div className={styles.container}>
        <PageHeader
          title="Rewards"
          subtitle={<>Monthly TACo reward distributions — Merkle tree based payouts to stakers. Contract: <a href={`https://etherscan.io/address/${REWARDS_CONTRACT}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-green)' }}>{formatString(REWARDS_CONTRACT)}</a></>}
          stats={[
            { label: 'Total Distributed', value: `${formatTokenAmount(stats.totalDistributed)} T` },
            { label: 'Latest Month', value: `${formatTokenAmount(stats.latestDistribution || '0')} T` },
            { label: 'Stakers', value: stats.totalStakers },
            { label: 'Distributions', value: stats.distributions },
          ]}
        />

        {/* Distribution selector */}
        <div className={styles.filtersSection}>
          <div className={styles.filterControls}>
            <select
              value={selectedDist || ""}
              onChange={e => { setSelectedDist(e.target.value); setCurrentPage(1); }}
              className={styles.filterSelect}
            >
              {distributions.map(d => (
                <option key={d.date} value={d.date}>
                  {new Date(d.date).toLocaleDateString("en-US", { month: "long", year: "numeric" })} — {formatTokenAmount(d.thisDistributionAmount)} T
                </option>
              ))}
            </select>
          </div>
          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="Search by staker or beneficiary address..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Distribution overview cards */}
        {distributions.length > 1 && (
          <div className={styles.topEarners}>
            <h3 className={styles.sectionTitle}>Monthly Distribution History</h3>
            <div className={styles.earnersList}>
              {distributions.map((d, i) => (
                <div
                  key={d.date}
                  className={styles.earnerItem}
                  style={{ cursor: "pointer", background: d.date === selectedDist ? "#E5E7EB" : undefined }}
                  onClick={() => { setSelectedDist(d.date); setCurrentPage(1); }}
                >
                  <span className={styles.earnerRank}>
                    {new Date(d.date).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
                  </span>
                  <span className={styles.earnerAmount}>{formatTokenAmount(d.thisDistributionAmount)} T</span>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.8em" }}>{Object.keys(d.claims).length} stakers</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <span className={styles.tableInfo}>
              {filtered.length} stakers in {selectedDist ? new Date(selectedDist).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}
            </span>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.activityTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Staking Provider</th>
                  <th>Beneficiary</th>
                  <th>Earned This Month</th>
                  <th>Accumulated Total</th>
                  <th>Penalty</th>
                  <th>Failed Heartbeats</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((claim, idx) => (
                  <tr key={claim.address}>
                    <td style={{ color: "var(--text-secondary)" }}>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                    <td>
                      <Link to={`/node/${claim.address}`} className={styles.addressLink}>
                        {formatString(claim.address)}
                      </Link>
                    </td>
                    <td>
                      {claim.beneficiary && claim.beneficiary !== claim.address ? (
                        <Link to={`/node/${claim.beneficiary}`} className={styles.addressLink}>
                          {formatString(claim.beneficiary)}
                        </Link>
                      ) : (
                        <span style={{ color: "var(--text-secondary)" }}>same</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 600, color: "#10B981" }}>
                      {formatTokenAmount(claim.earnedThisDistribution)} T
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {formatTokenAmount(claim.accumulatedAmount)} T
                    </td>
                    <td>
                      {claim.penaltyThisDistribution && claim.penaltyThisDistribution !== "0" ? (
                        <span style={{ color: "#EF4444", fontWeight: 600 }}>
                          {formatTokenAmount(claim.penaltyThisDistribution)} T
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-secondary)" }}>—</span>
                      )}
                    </td>
                    <td>
                      {claim.failedHeartbeats && claim.failedHeartbeats.length > 0 ? (
                        <span style={{ color: "#F59E0B", fontWeight: 600 }}>
                          {claim.failedHeartbeats.length}
                        </span>
                      ) : (
                        <span style={{ color: "#10B981" }}>0</span>
                      )}
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--text-secondary)" }}>No stakers found</td></tr>
                )}
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
