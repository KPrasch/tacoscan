import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getNodeDetail, getTimeout, isBetaStaker } from "./data";
import { formatString, formatWeiDecimal, formatTimeToText } from "./data";
import styles from "./NodeDetail.module.css";
import { getRewardStatus, getRewardExplanation, RewardStatusLabels, RewardStatusColors, RewardStatusIcons, RewardStatus, BETA_STAKERS, NODES_REQUESTED_EXIT } from "../utils/rewardEligibility";

const NodeDetail = () => {
  const { address } = useParams();
  const [loading, setLoading] = useState(true);
  const [nodeData, setNodeData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchNodeData = async () => {
      try {
        const data = await getNodeDetail(address);
        if (data) {
          const formatted = await formatNodeDetail(data);

          // Also fetch rituals for this node and timeout value
          try {
            const [ritualsResponse, timeout] = await Promise.all([
              fetch(
                import.meta.env.VITE_SUBGRAPH_POLYGON,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    query: `
                    query GetRitualsForNode($node: Bytes!) {
                      rituals(where: { participants_contains: [$node] }, first: 100) {
                        id
                        startedAt
                        endedAt
                        authority
                        status
                        participants
                      }
                    }
                  `,
                    variables: { node: address.toLowerCase() },
                  }),
                },
              ),
              getTimeout(),
            ]);

            if (!ritualsResponse.ok)
              throw new Error(`HTTP ${ritualsResponse.status}`);
            const ritualsData = await ritualsResponse.json();
            if (ritualsData?.data?.rituals) {
              const timeoutMs = parseFloat(timeout) * 1000;
              const currentTimestamp = Date.now();

              formatted.rituals = ritualsData.data.rituals.map((r) => {
                const initTimestampMs = parseInt(r.startedAt) * 1000;
                const timeoutStamp = initTimestampMs + timeoutMs;
                const normalizedStatus = r.status?.toUpperCase();

                let status = normalizedStatus?.replaceAll("_", " ") || "PENDING";
                if (normalizedStatus === "AWAITING_TRANSCRIPTS") status = "AWAITING TRANSCRIPTS";
                if (normalizedStatus === "AWAITING_AGGREGATIONS") status = "AWAITING AGGREGATIONS";
                if (
                  (normalizedStatus === "AWAITING_AGGREGATIONS" ||
                    normalizedStatus === "AWAITING_TRANSCRIPTS") &&
                  timeoutStamp < currentTimestamp
                ) {
                  status = "EXPIRED";
                }

                return {
                  id: r.id,
                  status: status,
                  authority: r.authority,
                  participants: r.participants?.length || 0,
                  updateTime:
                    r.endedAt || r.startedAt
                      ? parseInt(r.endedAt || r.startedAt) * 1000
                      : Date.now(),
                };
              });
            }
          } catch (err) {
            console.error("Error fetching rituals:", err);
          }

          setNodeData(formatted);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching node details:", error);
        setLoading(false);
      }
    };

    fetchNodeData();
  }, [address]);

  const formatNodeDetail = async (data) => {
    if (!data || !data.appAuthorization) return null;

    const auth = data.appAuthorization;
    const stakingProvider = auth.id?.split("-")[0] || address;

    // Check if this is a beta staker
    const isBeta = await isBetaStaker(stakingProvider);
    
    // Determine reward eligibility
    const rewardStatus = getRewardStatus(auth);

    // Use BigInt for accurate wei to token conversion
    const formatAmount = (weiAmount) => {
      if (!weiAmount) return 0;
      try {
        const wei = BigInt(weiAmount.toString());
        const divisor = BigInt("1000000000000000000"); // 10^18
        return Number(wei / divisor);
      } catch {
        return 0;
      }
    };

    // Check if node is deauthorized (had stake before but now has 0)
    const hasBeenDeauthorized = auth.stake?.stakeHistory?.some(
      (event) =>
        event.eventType === "Unstaked" ||
        event.eventType === "AuthorizationDecreaseApproved",
    );

    // Get the last staked amount from history if current is 0
    const getHistoricalStake = () => {
      if (auth.stake?.stakeHistory) {
        const stakedEvents = auth.stake.stakeHistory.filter(
          (e) => e.eventType === "Staked",
        );
        if (stakedEvents.length > 0) {
          return formatAmount(stakedEvents[0].eventAmount);
        }
      }
      return 0;
    };

    // Collect all events
    const allEvents = [
      ...(data.appAuthHistories || []),
      ...(auth.stake?.stakeHistory || []),
    ];

    // Add OperatorBonded event if available
    if (auth.tacoOperator?.bondedTimestamp) {
      allEvents.push({
        eventType: "OperatorBonded",
        operator: auth.tacoOperator.operator,
        timestamp: auth.tacoOperator.bondedTimestamp,
        blockNumber: null, // Not available in current data
        txHash: null, // Not available in current data
      });
    }

    return {
      id: stakingProvider,
      operator: auth.tacoOperator?.operator || "-",
      isConfirmed: auth.tacoOperator?.confirmed || false,
      authorizedAmount: formatAmount(auth.amount),
      stakedAmount: formatAmount(auth.stake?.stakedAmount),
      historicalStake: getHistoricalStake(),
      isDeauthorized: hasBeenDeauthorized && formatAmount(auth.amount) === 0,
      bondedAt: auth.tacoOperator?.bondedTimestamp
        ? new Date(auth.tacoOperator.bondedTimestamp * 1000)
        : null,
      isBetaStaker: isBeta,
      rewardStatus: rewardStatus,
      rewardStatusLabel: RewardStatusLabels[rewardStatus],
      rewardExplanation: getRewardExplanation(rewardStatus),
      isRequestedExit: NODES_REQUESTED_EXIT.has(stakingProvider.toLowerCase()),
      // V2 extended fields
      isReleased: data.isReleased || false,
      isSlashed: data.isSlashed || false,
      isPenalized: data.isPenalized || false,
      totalRewards: data.totalRewards || '0',
      totalRewardsWithdrawn: data.totalRewardsWithdrawn || '0',
      totalPenalty: data.totalPenalty || '0',
      endDeauthorization: data.endDeauthorization || '0',
      isChildSynced: data.isChildSynced,
      commitmentEndTimestamp: data.commitmentEndTimestamp,
      rewardEvents: (data.rewardEvents || []).map(e => ({
        type: e.eventType,
        amount: e.amount,
        beneficiary: e.beneficiary,
        timestamp: parseInt(e.timestamp) * 1000,
        txHash: e.transactionHash,
      })),
      infractions: (data.infractions || []).map(i => ({
        type: i.infractionTypeName,
        ritualId: i.ritual?.id,
        timestamp: parseInt(i.timestamp) * 1000,
      })),
      events: allEvents
        .map((event) => ({
          type: event.eventType,
          amount: event.eventAmount || event.amount,
          operator: event.operator || null,
          timestamp: event.timestamp
            ? parseInt(event.timestamp) * 1000
            : Date.now(),
          blockNumber: event.blockNumber,
          txHash: event.txHash || null,
        }))
        .sort((a, b) => b.timestamp - a.timestamp),
      stakeHistory: auth.stake?.stakeHistory || [],
      rituals: [],
    };
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>Loading node details...</div>
      </div>
    );
  }

  if (!nodeData) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>Node not found</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header Section - Etherscan Style */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>Node Operator</h1>
            <div className={styles.badge}>
              {nodeData.isBetaStaker && (
                <span
                  style={{
                    background: "#6366F1",
                    color: "#FFFFFF",
                    padding: "4px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: 500,
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.025em",
                    marginRight: "8px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span style={{ fontSize: "14px" }}>⭐</span> Beta Staker
                </span>
              )}
              {nodeData.isDeauthorized ? (
                <span className={styles.deauthorizedBadge}>Deauthorized</span>
              ) : nodeData.isConfirmed ? (
                <span className={styles.confirmedBadge}>✓ Confirmed</span>
              ) : (
                <span className={styles.unconfirmedBadge}>Unconfirmed</span>
              )}
              {nodeData.isRequestedExit && (
                <span style={{
                  background: "#F59E0B",
                  color: "#FFFFFF",
                  padding: "4px 12px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 500,
                  fontFamily: "var(--font-mono)",
                  marginLeft: "8px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}>🚪 Requested Exit</span>
              )}
              <span style={{
                background: RewardStatusColors[nodeData.rewardStatus] + '20',
                color: RewardStatusColors[nodeData.rewardStatus],
                border: `1px solid ${RewardStatusColors[nodeData.rewardStatus]}`,
                padding: "4px 12px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 500,
                fontFamily: "var(--font-mono)",
                marginLeft: "8px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}>
                {RewardStatusIcons[nodeData.rewardStatus]} {nodeData.rewardStatusLabel}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.addressSection}>
          <span className={styles.addressLabel}>Staking Provider:</span>
          <span className={styles.address}>{address}</span>
          <button
            className={styles.copyButton}
            onClick={() => copyToClipboard(address)}
            title="Copy address"
          >
            📋
          </button>
          <a
            href={`https://etherscan.io/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.etherscanLink}
          >
            View on Etherscan ↗
          </a>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Authorized Amount</div>
          <div className={styles.statValue}>
            {new Intl.NumberFormat().format(nodeData.authorizedAmount)} T
          </div>
          <div
            className={styles.statSubtext}
            style={{ color: nodeData.isDeauthorized ? "#059669" : undefined }}
          >
            {nodeData.stakedAmount > 0
              ? `${((nodeData.authorizedAmount / nodeData.stakedAmount) * 100).toFixed(1)}% of stake`
              : nodeData.isDeauthorized
                ? "Deauthorized"
                : "-"}
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Staked Amount</div>
          <div className={styles.statValue}>
            {new Intl.NumberFormat().format(nodeData.stakedAmount)} T
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Operator Address</div>
          <div className={styles.statValue}>
            {nodeData.operator && nodeData.operator !== "-" ? (
              <a
                href={`https://etherscan.io/address/${nodeData.operator}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.operatorLink}
              >
                {formatString(nodeData.operator)}
              </a>
            ) : (
              "-"
            )}
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Bonded Since</div>
          <div className={styles.statValue}>
            {nodeData.bondedAt
              ? formatTimeToText(nodeData.bondedAt.getTime())
              : "Not bonded"}
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "overview" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`${styles.tab} ${activeTab === "rituals" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("rituals")}
          >
            DKG Rituals
          </button>
          <button
            className={`${styles.tab} ${activeTab === "events" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("events")}
          >
            Events
          </button>
          <button
            className={`${styles.tab} ${activeTab === "rewards" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("rewards")}
          >
            Rewards
          </button>
          {nodeData.infractions?.length > 0 && (
            <button
              className={`${styles.tab} ${activeTab === "infractions" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("infractions")}
            >
              Infractions ({nodeData.infractions.length})
            </button>
          )}
        </div>

        <div className={styles.tabContent}>
          {activeTab === "overview" && (
            <div className={styles.overviewContent}>
              <div className={styles.infoSection}>
                <h3 className={styles.sectionTitle}>Node Information</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Status:</span>
                    <span className={styles.infoValue}>
                      {nodeData.isDeauthorized ? (
                        <span className={styles.statusInactive}>
                          Deauthorized
                        </span>
                      ) : nodeData.isConfirmed ? (
                        <span className={styles.statusActive}>Active</span>
                      ) : (
                        <span className={styles.statusInactive}>Inactive</span>
                      )}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Network:</span>
                    <span className={styles.infoValue}>Polygon</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Protocol:</span>
                    <span className={styles.infoValue}>TACo</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>
                      Authorization Status:
                    </span>
                    <span className={styles.infoValue}>
                      {nodeData.isDeauthorized
                        ? "Deauthorized"
                        : nodeData.authorizedAmount > 0
                          ? "Authorized"
                          : "Not Authorized"}
                    </span>
                  </div>
                  {nodeData.isSlashed && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>⚠️ Slashed:</span>
                      <span className={styles.infoValue} style={{ color: '#EF4444' }}>Yes</span>
                    </div>
                  )}
                  {nodeData.isPenalized && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>⚠️ Penalized:</span>
                      <span className={styles.infoValue} style={{ color: '#EF4444' }}>Yes</span>
                    </div>
                  )}
                  {nodeData.isReleased && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Released:</span>
                      <span className={styles.infoValue}>Yes</span>
                    </div>
                  )}
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Child Chain Synced:</span>
                    <span className={styles.infoValue}>
                      {nodeData.isChildSynced ? '✓ Synced' : '✗ Not synced'}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.infoSection}>
                <h3 className={styles.sectionTitle}>Reward Eligibility</h3>
                <div style={{
                  background: RewardStatusColors[nodeData.rewardStatus] + '10',
                  border: `1px solid ${RewardStatusColors[nodeData.rewardStatus]}40`,
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '8px', color: RewardStatusColors[nodeData.rewardStatus] }}>
                    {RewardStatusIcons[nodeData.rewardStatus]} {nodeData.rewardStatusLabel}
                  </div>
                  <div style={{ color: '#4B5563', fontSize: '0.875rem', lineHeight: 1.5 }}>
                    {nodeData.rewardExplanation}
                  </div>
                </div>
                {nodeData.rewardStatus === 'reward_eligible' && (
                  <div style={{ fontSize: '0.8rem', color: '#6B7280', fontStyle: 'italic' }}>
                    💡 Rewards are calculated based on authorized stake × time × 3.75% APR (capped at 15M T). 
                    Nodes failing heartbeat rituals receive penalties: 2 failures = 33% penalty, 3 = 67%, 4+ = 100%.
                  </div>
                )}
              </div>

              <div className={styles.infoSection}>
                <h3 className={styles.sectionTitle}>Staking Details</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Total Staked:</span>
                    <span className={styles.infoValue}>
                      {new Intl.NumberFormat().format(nodeData.stakedAmount)} T
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>
                      Authorized to TACo:
                    </span>
                    <span className={styles.infoValue}>
                      {new Intl.NumberFormat().format(
                        nodeData.authorizedAmount,
                      )}{" "}
                      T
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>
                      Authorization Rate:
                    </span>
                    <span className={styles.infoValue}>
                      {nodeData.stakedAmount > 0
                        ? `${((nodeData.authorizedAmount / nodeData.stakedAmount) * 100).toFixed(2)}%`
                        : "0%"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "rituals" && (
            <div className={styles.ritualsContent}>
              <div className={styles.tableContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Ritual ID</th>
                      <th>Status</th>
                      <th>Authority</th>
                      <th>Participants</th>
                      <th>Age</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nodeData.rituals.length > 0 ? (
                      nodeData.rituals.map((ritual) => (
                        <tr key={ritual.id}>
                          <td>
                            <Link
                              to={`/ritual/${ritual.id}`}
                              className={styles.idLink}
                            >
                              #{ritual.id}
                            </Link>
                          </td>
                          <td>
                            <span
                              className={`${styles.status} ${styles[ritual.status?.toLowerCase()]}`}
                            >
                              {ritual.status}
                            </span>
                          </td>
                          <td>
                            <a
                              href={`https://polygonscan.com/address/${ritual.authority}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.addressLink}
                            >
                              {formatString(ritual.authority)}
                            </a>
                          </td>
                          <td>{ritual.participants || 0}</td>
                          <td>{formatTimeToText(ritual.updateTime)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className={styles.noData}>
                          No rituals found for this node
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "events" && (
            <div className={styles.eventsContent}>
              <div className={styles.tableContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Amount</th>
                      <th>Time</th>
                      <th>Transaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nodeData.events.length > 0 ? (
                      nodeData.events.map((event, idx) => {
                        const formatEventAmount = (amount) => {
                          if (!amount) return "0";
                          try {
                            const wei = BigInt(amount.toString());
                            const divisor = BigInt("1000000000000000000");
                            const tokens = Number(wei / divisor);
                            return new Intl.NumberFormat().format(tokens);
                          } catch {
                            return "0";
                          }
                        };

                        return (
                          <tr key={idx}>
                            <td className={styles.eventType}>
                              {event.type || "Unknown"}
                            </td>
                            <td>
                              {event.amount
                                ? `${formatEventAmount(event.amount)} T`
                                : "-"}
                            </td>
                            <td>{formatTimeToText(event.timestamp)}</td>
                            <td>
                              {event.blockNumber ? (
                                <a
                                  href={`https://etherscan.io/block/${event.blockNumber}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.txLink}
                                >
                                  Block #{event.blockNumber}
                                </a>
                              ) : (
                                <span className={styles.pending}>Pending</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="4" className={styles.noData}>
                          No events found for this node
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "rewards" && (
            <div className={styles.eventsContent}>
              {/* Rewards Summary */}
              <div className={styles.statsGrid} style={{ marginBottom: '24px' }}>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Total Rewards</div>
                  <div className={styles.statValue}>
                    {(() => {
                      try { return new Intl.NumberFormat().format(Number(BigInt(nodeData.totalRewards || '0') / BigInt('1000000000000000000'))); }
                      catch { return '0'; }
                    })()} T
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Withdrawn</div>
                  <div className={styles.statValue}>
                    {(() => {
                      try { return new Intl.NumberFormat().format(Number(BigInt(nodeData.totalRewardsWithdrawn || '0') / BigInt('1000000000000000000'))); }
                      catch { return '0'; }
                    })()} T
                  </div>
                </div>
              </div>
              <div className={styles.tableContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Amount</th>
                      <th>Beneficiary</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nodeData.rewardEvents?.length > 0 ? (
                      nodeData.rewardEvents.map((evt, idx) => (
                        <tr key={idx}>
                          <td className={styles.eventType}>{evt.type?.replace(/_/g, ' ')}</td>
                          <td>
                            {evt.amount ? (() => {
                              try { return new Intl.NumberFormat().format(Number(BigInt(evt.amount) / BigInt('1000000000000000000'))) + ' T'; }
                              catch { return evt.amount; }
                            })() : '-'}
                          </td>
                          <td>
                            {evt.beneficiary ? (
                              <a href={`https://etherscan.io/address/${evt.beneficiary}`} target="_blank" rel="noopener noreferrer" className={styles.addressLink}>
                                {formatString(evt.beneficiary)}
                              </a>
                            ) : '-'}
                          </td>
                          <td>{formatTimeToText(evt.timestamp)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4" className={styles.noData}>No reward events</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "infractions" && (
            <div className={styles.eventsContent}>
              <div className={styles.tableContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Infraction Type</th>
                      <th>Ritual</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nodeData.infractions?.map((inf, idx) => (
                      <tr key={idx}>
                        <td style={{ color: '#EF4444' }}>{inf.type}</td>
                        <td>
                          {inf.ritualId ? (
                            <Link to={`/ritual/${inf.ritualId}`} className={styles.idLink}>#{inf.ritualId}</Link>
                          ) : '-'}
                        </td>
                        <td>{formatTimeToText(inf.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NodeDetail;
