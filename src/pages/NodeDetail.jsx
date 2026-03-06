import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getNodeDetail, getTimeout, isBetaStaker, formatString, formatTimeToText } from "./data";
import styles from "./NodeDetail.module.css";
import { getRewardStatus, getRewardExplanation, RewardStatusLabels, RewardStatusColors, RewardStatusIcons, hasRequestedExit } from "../utils/rewardEligibility";
import { networkConfig } from "../utils/networkConfig";
import { PageSkeleton } from "../components/Skeleton";

const short = (addr) => addr ? `${addr.slice(0, 8)}…${addr.slice(-6)}` : '—';

const fmtT = (wei) => {
  if (!wei) return '0';
  try { return new Intl.NumberFormat().format(Number(BigInt(wei.toString()) / BigInt('1000000000000000000'))); }
  catch { return '0'; }
};

const fmtAmt = (n) => n ? new Intl.NumberFormat().format(n) : '0';

const fmtWeiT = (amount) => {
  if (!amount) return '—';
  try {
    const wei = BigInt(amount.toString());
    return new Intl.NumberFormat().format(Number(wei / BigInt('1000000000000000000'))) + ' T';
  } catch { return '—'; }
};

function KV({ label, children, mono }) {
  return (
    <div className={styles.kv}>
      <span className={styles.kvLabel}>{label}</span>
      <span className={`${styles.kvValue}${mono ? ' ' + styles.kvMono : ''}`}>{children}</span>
    </div>
  );
}

const TABS = ['rituals', 'authorization', 'events', 'rewards', 'infractions'];

const NodeDetail = () => {
  const { address } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [nodeData, setNodeData] = useState(null);
  const [activeTab, setActiveTab] = useState('rituals');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchNodeData = async () => {
      try {
        const data = await getNodeDetail(address);
        if (data) {
          const formatted = await formatNodeDetail(data);
          try {
            const [ritualsResponse, timeout] = await Promise.all([
              fetch(networkConfig.subgraphPolygon, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  query: `query GetRitualsForNode($node: Bytes!) {
                    rituals(where: { participants_contains: [$node] }, first: 100) {
                      id startedAt endedAt authority status participants
                    }
                  }`,
                  variables: { node: address.toLowerCase() },
                }),
              }),
              getTimeout(),
            ]);
            if (!ritualsResponse.ok) throw new Error(`HTTP ${ritualsResponse.status}`);
            const ritualsData = await ritualsResponse.json();
            if (ritualsData?.data?.rituals) {
              const timeoutMs = parseFloat(timeout) * 1000;
              const now = Date.now();
              formatted.rituals = ritualsData.data.rituals.map((r) => {
                const initMs = parseInt(r.startedAt) * 1000;
                const normalizedStatus = r.status?.toUpperCase();
                let status = normalizedStatus?.replaceAll("_", " ") || "PENDING";
                if (normalizedStatus === "AWAITING_TRANSCRIPTS") status = "AWAITING TRANSCRIPTS";
                if (normalizedStatus === "AWAITING_AGGREGATIONS") status = "AWAITING AGGREGATIONS";
                if ((normalizedStatus === "AWAITING_AGGREGATIONS" || normalizedStatus === "AWAITING_TRANSCRIPTS") && initMs + timeoutMs < now) status = "EXPIRED";
                return {
                  id: r.id, status,
                  authority: r.authority,
                  participants: r.participants?.length || 0,
                  updateTime: r.endedAt || r.startedAt ? parseInt(r.endedAt || r.startedAt) * 1000 : now,
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
    const isBeta = await isBetaStaker(stakingProvider);
    const rewardStatus = getRewardStatus(auth, data);

    const formatAmount = (weiAmount) => {
      if (!weiAmount) return 0;
      try {
        const wei = BigInt(weiAmount.toString());
        return Number(wei / BigInt("1000000000000000000"));
      } catch { return 0; }
    };

    const hasBeenDeauthorized = auth.stake?.stakeHistory?.some(
      (e) => e.eventType === "Unstaked" || e.eventType === "AuthorizationDecreaseApproved"
    );

    const allEvents = [
      ...(data.appAuthHistories || []),
      ...(auth.stake?.stakeHistory || []),
    ];
    if (auth.tacoOperator?.bondedTimestamp) {
      allEvents.push({
        eventType: "OperatorBonded",
        operator: auth.tacoOperator.operator,
        timestamp: auth.tacoOperator.bondedTimestamp,
        blockNumber: null, txHash: null,
      });
    }

    return {
      id: stakingProvider,
      operator: auth.tacoOperator?.operator || "-",
      isConfirmed: auth.tacoOperator?.confirmed || false,
      authorizedAmount: formatAmount(auth.amount),
      stakedAmount: formatAmount(auth.stake?.stakedAmount),
      isDeauthorized: hasBeenDeauthorized && formatAmount(auth.amount) === 0,
      bondedAt: auth.tacoOperator?.bondedTimestamp ? new Date(auth.tacoOperator.bondedTimestamp * 1000) : null,
      isBetaStaker: isBeta,
      rewardStatus,
      rewardStatusLabel: RewardStatusLabels[rewardStatus],
      rewardExplanation: getRewardExplanation(rewardStatus),
      isRequestedExit: hasRequestedExit(data),
      isReleased: data.isReleased || false,
      isSlashed: data.isSlashed || false,
      isPenalized: data.isPenalized || false,
      totalRewards: data.totalRewards || '0',
      totalRewardsWithdrawn: data.totalRewardsWithdrawn || '0',
      totalPenalty: data.totalPenalty || '0',
      isChildSynced: data.isChildSynced,
      commitmentEndTimestamp: data.commitmentEndTimestamp,
      rewardEvents: (data.rewardEvents || []).map(e => ({
        type: e.eventType, amount: e.amount, beneficiary: e.beneficiary,
        timestamp: parseInt(e.timestamp) * 1000,
        txHash: e.transactionHash || e.txHash,
      })),
      infractions: (data.infractions || []).map(i => ({
        type: i.infractionTypeName, ritualId: i.ritual?.id,
        timestamp: parseInt(i.timestamp) * 1000,
      })),
      authorizationHistory: (data.appAuthHistories || []).map(e => ({
        type: e.eventType, fromAmount: e.fromAmount,
        toAmount: e.amount || e.eventAmount,
        timestamp: e.timestamp ? parseInt(e.timestamp) * 1000 : Date.now(),
        blockNumber: e.blockNumber, txHash: e.txHash,
      })).sort((a, b) => b.timestamp - a.timestamp),
      events: allEvents.map((e) => ({
        type: e.eventType, amount: e.eventAmount || e.amount,
        operator: e.operator || null,
        timestamp: e.timestamp ? parseInt(e.timestamp) * 1000 : Date.now(),
        blockNumber: e.blockNumber, txHash: e.txHash || null,
      })).sort((a, b) => b.timestamp - a.timestamp),
      rituals: [],
    };
  };

  const copyAddr = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading) return <PageSkeleton />;

  if (!nodeData) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.errorBox}>
            <Link to="/nodes" className={styles.breadLink}>← Nodes</Link>
            <span>Node {short(address)} not found.</span>
          </div>
        </div>
      </div>
    );
  }

  const statusLabel = nodeData.isDeauthorized ? 'Deauthorized' : nodeData.isConfirmed ? 'Active' : 'Unconfirmed';
  const statusClass = nodeData.isDeauthorized ? 'state_deauth' : nodeData.isConfirmed ? 'state_active' : 'state_unconfirmed';

  const tabCounts = {
    rituals:       nodeData.rituals?.length || 0,
    authorization: nodeData.authorizationHistory?.length || 0,
    events:        nodeData.events?.length || 0,
    rewards:       nodeData.rewardEvents?.length || 0,
    infractions:   nodeData.infractions?.length || 0,
  };

  const visibleTabs = TABS.filter(t => t !== 'infractions' || tabCounts.infractions > 0);

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* ── Header row ── */}
        <div className={styles.headerRow}>
          <div className={styles.breadcrumb}>
            <Link to="/nodes" className={styles.breadLink}>Nodes</Link>
            <span className={styles.sep}>/</span>
            <span className={styles.breadCurrent}>{short(address)}</span>
            {nodeData.isBetaStaker && <span className={`${styles.statePill} ${styles.pillBeta}`}>Beta</span>}
          </div>
          <div className={styles.headerMeta}>
            <span className={`${styles.statePill} ${styles[statusClass]}`}>{statusLabel}</span>
            <span className={styles.metaDot}>·</span>
            <span
              className={styles.statePill}
              style={{
                background: RewardStatusColors[nodeData.rewardStatus] + '18',
                color: RewardStatusColors[nodeData.rewardStatus],
                borderColor: RewardStatusColors[nodeData.rewardStatus] + '55',
              }}
            >
              {RewardStatusIcons[nodeData.rewardStatus]} {nodeData.rewardStatusLabel}
            </span>
            {nodeData.isRequestedExit && (
              <><span className={styles.metaDot}>·</span>
              <span className={`${styles.statePill} ${styles.pillExit}`}>Requested Exit</span></>
            )}
            {nodeData.bondedAt && (
              <><span className={styles.metaDot}>·</span>
              <span className={styles.metaAge}>{formatTimeToText(nodeData.bondedAt.getTime())}</span></>
            )}
          </div>
        </div>

        {/* ── Info grid ── */}
        <div className={styles.infoGrid}>

          {/* Identity */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardTitle}>Identity</div>
            <div className={styles.kv}>
              <span className={styles.kvLabel}>Provider</span>
              <span className={`${styles.kvValue} ${styles.kvMono}`} style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                <span title={address}>{short(address)}</span>
                <button className={styles.copyBtn} onClick={copyAddr}>{copied ? '✓' : 'copy'}</button>
                <a href={`https://etherscan.io/address/${address}`} target="_blank" rel="noopener noreferrer" className={styles.addrLink}>↗</a>
              </span>
            </div>
            <KV label="Operator" mono>
              {nodeData.operator && nodeData.operator !== '-'
                ? <a href={`https://etherscan.io/address/${nodeData.operator}`} target="_blank" rel="noopener noreferrer" className={styles.addrLink}>{short(nodeData.operator)}</a>
                : '—'}
            </KV>
            <KV label="Authorized" mono>{fmtAmt(nodeData.authorizedAmount)} T</KV>
            <KV label="Staked" mono>{fmtAmt(nodeData.stakedAmount)} T</KV>
            <KV label="Auth Rate" mono>
              {nodeData.stakedAmount > 0
                ? `${((nodeData.authorizedAmount / nodeData.stakedAmount) * 100).toFixed(1)}%`
                : '—'}
            </KV>
            <KV label="Network">Polygon</KV>
            <KV label="Confirmed">{nodeData.isConfirmed ? <span className={styles.yes}>Yes</span> : <span className={styles.no}>No</span>}</KV>
            <KV label="Child Synced">{nodeData.isChildSynced ? <span className={styles.yes}>Yes</span> : <span className={styles.no}>No</span>}</KV>
            {nodeData.isSlashed && <KV label="Slashed"><span className={styles.no}>Yes</span></KV>}
            {nodeData.isPenalized && <KV label="Penalized"><span className={styles.warn}>Yes</span></KV>}
            {nodeData.isReleased && <KV label="Released"><span className={styles.no}>Yes</span></KV>}
            {nodeData.bondedAt && <KV label="Bonded">{formatTimeToText(nodeData.bondedAt.getTime())}</KV>}
          </div>

          {/* Staking & Rewards */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardTitle}>Staking &amp; Rewards</div>
            <div
              className={styles.rewardBanner}
              style={{
                borderColor: RewardStatusColors[nodeData.rewardStatus] + '40',
                background: RewardStatusColors[nodeData.rewardStatus] + '0d',
              }}
            >
              <div className={styles.rewardBannerTitle} style={{ color: RewardStatusColors[nodeData.rewardStatus] }}>
                {RewardStatusIcons[nodeData.rewardStatus]} {nodeData.rewardStatusLabel}
              </div>
              <div className={styles.rewardBannerText}>{nodeData.rewardExplanation}</div>
            </div>
            <KV label="Total Rewards" mono>{fmtT(nodeData.totalRewards)} T</KV>
            <KV label="Withdrawn" mono>{fmtT(nodeData.totalRewardsWithdrawn)} T</KV>
            <KV label="Penalties" mono>{fmtT(nodeData.totalPenalty)} T</KV>
            {nodeData.commitmentEndTimestamp && parseInt(nodeData.commitmentEndTimestamp) > 0 && (
              <KV label="Commitment End">
                {new Date(parseInt(nodeData.commitmentEndTimestamp) * 1000).toLocaleDateString()}
              </KV>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className={styles.tabs}>
          {visibleTabs.map((t) => (
            <button
              key={t}
              className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(t)}
            >
              {t === 'rituals' ? 'DKG Rituals' : t === 'authorization' ? 'Authorization' : t.charAt(0).toUpperCase() + t.slice(1)}
              {tabCounts[t] > 0 && <span className={styles.tabBadge}>{tabCounts[t]}</span>}
            </button>
          ))}
        </div>

        <div className={styles.tabBody}>

          {activeTab === 'rituals' && (
            nodeData.rituals.length > 0 ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Status</th>
                    <th>Authority</th>
                    <th>Participants</th>
                    <th>Age</th>
                  </tr>
                </thead>
                <tbody>
                  {nodeData.rituals.map((r) => (
                    <tr key={r.id}>
                      <td><Link to={`/rituals/${r.id}`} className={styles.addrLink}>#{r.id}</Link></td>
                      <td>
                        <span className={`${styles.resultBadge} ${
                          r.status === 'SUCCESSFUL' || r.status === 'ACTIVE' ? styles.resultOk
                          : r.status?.includes('AWAITING') ? styles.resultPending
                          : styles.resultFail
                        }`}>{r.status}</span>
                      </td>
                      <td className={styles.monoCell}>
                        <a href={`https://polygonscan.com/address/${r.authority}`} target="_blank" rel="noopener noreferrer" className={styles.addrLink}>{formatString(r.authority)}</a>
                      </td>
                      <td className={styles.dimCell}>{r.participants}</td>
                      <td className={styles.ageCell}>{formatTimeToText(r.updateTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={styles.emptyTab}>No rituals found for this node.</div>
            )
          )}

          {activeTab === 'authorization' && (
            nodeData.authorizationHistory?.length > 0 ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Amount</th>
                    <th>Block</th>
                    <th>Time</th>
                    <th>Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {nodeData.authorizationHistory.map((evt, idx) => (
                    <tr key={idx}>
                      <td className={styles.eventType}>{evt.type?.replace(/_/g, ' ')}</td>
                      <td className={styles.monoCell}>{fmtWeiT(evt.toAmount)}</td>
                      <td className={styles.monoCell}>
                        {evt.blockNumber
                          ? <a href={`https://etherscan.io/block/${evt.blockNumber}`} target="_blank" rel="noopener noreferrer" className={styles.addrLink}>{evt.blockNumber}</a>
                          : '—'}
                      </td>
                      <td className={styles.ageCell}>{formatTimeToText(evt.timestamp)}</td>
                      <td className={styles.monoCell}>
                        {evt.txHash
                          ? <a href={`https://etherscan.io/tx/${evt.txHash}`} target="_blank" rel="noopener noreferrer" className={styles.addrLink}>{formatString(evt.txHash)}</a>
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={styles.emptyTab}>No authorization events.</div>
            )
          )}

          {activeTab === 'events' && (
            nodeData.events.length > 0 ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Amount</th>
                    <th>Time</th>
                    <th>Block</th>
                  </tr>
                </thead>
                <tbody>
                  {nodeData.events.map((evt, idx) => (
                    <tr key={idx}>
                      <td className={styles.eventType}>{evt.type || 'Unknown'}</td>
                      <td className={styles.monoCell}>{evt.amount ? fmtWeiT(evt.amount) : '—'}</td>
                      <td className={styles.ageCell}>{formatTimeToText(evt.timestamp)}</td>
                      <td className={styles.monoCell}>
                        {evt.blockNumber
                          ? <a href={`https://etherscan.io/block/${evt.blockNumber}`} target="_blank" rel="noopener noreferrer" className={styles.addrLink}>#{evt.blockNumber}</a>
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={styles.emptyTab}>No events found.</div>
            )
          )}

          {activeTab === 'rewards' && (
            nodeData.rewardEvents?.length > 0 ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Amount</th>
                    <th>Beneficiary</th>
                    <th>Time</th>
                    <th>Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {nodeData.rewardEvents.map((evt, idx) => (
                    <tr key={idx}>
                      <td className={styles.eventType}>{evt.type?.replace(/_/g, ' ')}</td>
                      <td className={styles.monoCell}>{evt.amount ? fmtWeiT(evt.amount) : '—'}</td>
                      <td className={styles.monoCell}>
                        {evt.beneficiary
                          ? <a href={`https://etherscan.io/address/${evt.beneficiary}`} target="_blank" rel="noopener noreferrer" className={styles.addrLink}>{formatString(evt.beneficiary)}</a>
                          : '—'}
                      </td>
                      <td className={styles.ageCell}>{formatTimeToText(evt.timestamp)}</td>
                      <td className={styles.monoCell}>
                        {evt.txHash
                          ? <a href={`https://etherscan.io/tx/${evt.txHash}`} target="_blank" rel="noopener noreferrer" className={styles.addrLink}>{formatString(evt.txHash)}</a>
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={styles.emptyTab}>No reward events.</div>
            )
          )}

          {activeTab === 'infractions' && (
            nodeData.infractions?.length > 0 ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Ritual</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {nodeData.infractions.map((inf, idx) => (
                    <tr key={idx}>
                      <td><span className={`${styles.resultBadge} ${styles.resultFail}`}>{inf.type}</span></td>
                      <td>
                        {inf.ritualId
                          ? <Link to={`/rituals/${inf.ritualId}`} className={styles.addrLink}>#{inf.ritualId}</Link>
                          : '—'}
                      </td>
                      <td className={styles.ageCell}>{formatTimeToText(inf.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={styles.emptyTab}>No infractions.</div>
            )
          )}

        </div>

        <div className={styles.footer}>
          <button className={styles.backBtn} onClick={() => navigate('/nodes')}>← Back to Nodes</button>
        </div>
      </div>
    </div>
  );
};

export default NodeDetail;
