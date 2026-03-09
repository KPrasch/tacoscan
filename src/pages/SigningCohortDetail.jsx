import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./SigningCohortDetail.module.css";
import { formatString, formatDate, calculateTimeMoment, formatTimeToText, getSigningCohortDetail } from "./data";
import ConditionRenderer from "../components/ConditionRenderer";
import ChainIcon from "../components/ChainIcon";
import { PageSkeleton } from "../components/Skeleton";

// ── Chain helpers ─────────────────────────────────────────────────────────────
const CHAIN_NAMES = {
  '1':        'Ethereum',
  '137':      'Polygon',
  '8453':     'Base',
  '11155111': 'Sepolia',
  '84532':    'Base Sepolia',
  '80001':    'Mumbai',
  '80002':    'Polygon Amoy',
};
const chainName = (id) => CHAIN_NAMES[String(id)] || `Chain ${id}`;

// ── Tiny address helper ───────────────────────────────────────────────────────
const short = (addr) => addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '—';

// ── Decode hex conditions ─────────────────────────────────────────────────────
function decodeConditions(hex) {
  if (!hex || hex === '0x') return null;
  try {
    const raw = hex.startsWith('0x') ? hex.slice(2) : hex;
    const bytes = new Uint8Array(raw.match(/.{1,2}/g).map(b => parseInt(b, 16)));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch { return null; }
}

// ── KV row (compact label + value) ───────────────────────────────────────────
function KV({ label, children, mono }) {
  return (
    <div className={styles.kv}>
      <span className={styles.kvLabel}>{label}</span>
      <span className={`${styles.kvValue} ${mono ? styles.kvMono : ''}`}>{children}</span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const SigningCohortDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cohort, setCohort] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRawJson, setShowRawJson] = useState(false);

  useEffect(() => {
    const fetchCohortDetails = async () => {
      try {
        const cohortData = await getSigningCohortDetail(id);
        if (!cohortData) { setError("Cohort not found"); return; }

        const resolvedSigners = cohortData.signers?.length
          ? cohortData.signers
          : (cohortData.participants || []);

        const conditionsDecoded = decodeConditions(cohortData.conditions);

        setCohort({
          id: cohortData.id,
          signers: resolvedSigners.map(addr => ({ address: addr })),
          signersCount: resolvedSigners.length,
          threshold: cohortData.multisig?.threshold || cohortData.threshold || 0,
          isActive: cohortData.status === 'DEPLOYED' || cohortData.status === 'CONDITIONS_SET',
          state: cohortData.status?.replace(/_/g, ' ') || 'Unknown',
          rawStatus: cohortData.status,
          authority: cohortData.authority,
          chainId: cohortData.chainId,
          domain: cohortData.domain,
          isDeployed: cohortData.isDeployed,
          deployedAt: cohortData.deployedAt,
          conditionsSetAt: cohortData.conditionsSetAt,
          multisigAddress: cohortData.multisigAddress,
          signatures: cohortData.signatures || [],
          multisig: cohortData.multisig,
          createdAt: cohortData.createdAt,
          updatedAt: cohortData.updatedAt,
          conditionsRaw: cohortData.conditions,
          conditionsDecoded,
          opExecutions: cohortData.opExecutions || [],
          providerCohortMap: cohortData.providerCohortMap || {},
        });
      } catch (e) {
        console.error("Error fetching cohort details:", e);
        setError("Failed to load cohort details");
      } finally {
        setLoading(false);
      }
    };
    fetchCohortDetails();
  }, [id]);

  if (loading) return <PageSkeleton />;

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorBox}>
          <span>{error}</span>
          <button onClick={() => navigate("/cohorts")} className={styles.backBtn}>← Back</button>
        </div>
      </div>
    );
  }

  const conditionData = cohort?.conditionsDecoded;

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* ── Compact header ─────────────────────────────────────────────── */}
        <div className={styles.headerRow}>
          <div className={styles.breadcrumb}>
            <a href="/cohorts" className={styles.breadLink}>Action Control</a>
            <span className={styles.sep}>/</span>
            <span className={styles.breadCurrent}>Cohort #{id}</span>
          </div>
          <div className={styles.headerMeta}>
            <span className={`${styles.statePill} ${styles['state_' + (cohort?.state || '').replace(/\s+/g, '_').toLowerCase()]}`}>
              {cohort?.state}
            </span>
            <span className={styles.metaDot}>·</span>
            <span className={styles.metaItem}>
              {cohort?.threshold
                ? `${cohort.threshold} of ${cohort.signersCount}`
                : `— of ${cohort?.signersCount}`}
            </span>
            <span className={styles.metaDot}>·</span>
            <span className={styles.metaItem}><ChainIcon chainId={cohort?.chainId} size={14} showLabel /></span>
            {cohort?.createdAt && (
              <>
                <span className={styles.metaDot}>·</span>
                <span className={styles.metaAge}>{calculateTimeMoment(parseInt(cohort.createdAt) * 1000)}</span>
              </>
            )}
          </div>
        </div>

        {/* ── Three-column info grid ──────────────────────────────────────── */}
        <div className={styles.infoGrid}>

          {/* Col A: Identity */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardTitle}>Identity</div>
            <KV label="ID">{cohort?.id}</KV>
            {cohort?.domain && <KV label="Domain" mono>{cohort.domain}</KV>}
            <KV label="Registered"><ChainIcon chainId="1" size={14} showLabel /> <span className={styles.chainId}>(Ethereum)</span></KV>
            <KV label="Target Chain">
              <ChainIcon chainId={cohort?.chainId} size={14} showLabel />
              <span className={styles.chainId}>({cohort?.chainId})</span>
              {cohort?.chainId && !['1', '137', '8453'].includes(String(cohort.chainId)) && (
                <span className={styles.testnetBadge}>testnet</span>
              )}
            </KV>
            {cohort?.authority && (
              <KV label="Authority" mono>
                <a href={`/address/${cohort.authority}`} className={styles.addrLink}>{short(cohort.authority)}</a>
              </KV>
            )}

            {/* Status progression timeline */}
            <div className={styles.kvSectionLabel}>Lifecycle</div>
            <div className={styles.lifecycle}>
              {[
                { label: 'Created', ts: cohort?.createdAt, status: 'COLLECTING_SIGNATURES' },
                { label: 'Conditions Set', ts: cohort?.conditionsSetAt, status: 'CONDITIONS_SET' },
                { label: 'Deployed', ts: cohort?.deployedAt, status: 'DEPLOYED' },
              ].map((step, i) => {
                const reached = !!step.ts;
                const isCurrent = cohort?.rawStatus === step.status;
                return (
                  <div key={i} className={`${styles.lifecycleStep} ${reached ? styles.lifecycleReached : styles.lifecyclePending} ${isCurrent ? styles.lifecycleCurrent : ''}`}>
                    <div className={styles.lifecycleDot} />
                    <div className={styles.lifecycleInfo}>
                      <span className={styles.lifecycleLabel}>{step.label}</span>
                      <span className={styles.lifecycleTime}>
                        {step.ts ? calculateTimeMoment(parseInt(step.ts) * 1000) : '—'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.kvSectionLabel}>EIP-1271 Smart Wallet</div>
            {cohort?.multisig ? (
              <>
                <KV label="Clone" mono>
                  <a href={`https://basescan.org/address/${cohort.multisig.id}`} target="_blank" rel="noopener noreferrer" className={styles.addrLink}>
                    {short(cohort.multisig.id)}
                  </a>
                </KV>
                <KV label="Threshold">{cohort.multisig.threshold || cohort.threshold || '—'} of {cohort.multisig.signers?.length || cohort.signersCount}</KV>
                {cohort.multisig.factory && (
                  <KV label="Factory" mono>
                    <a href={`https://basescan.org/address/${cohort.multisig.factory}`} target="_blank" rel="noopener noreferrer" className={styles.addrLink}>
                      {short(cohort.multisig.factory)}
                    </a>
                  </KV>
                )}
                <KV label="Cleared">{cohort.multisig.isCleared ? 'Yes' : 'No'}</KV>
              </>
            ) : (
              <KV label="Clone"><span className={styles.dimText}>Not deployed</span></KV>
            )}
          </div>

          {/* Col B: Conditions */}
          <div className={`${styles.infoCard} ${styles.condCard}`}>
            <div className={styles.infoCardTitle}>
              Conditions
              {conditionData && (
                <button className={styles.jsonToggleSmall} onClick={() => setShowRawJson(v => !v)}>
                  {showRawJson ? 'formatted' : 'JSON'}
                </button>
              )}
            </div>
            {conditionData ? (
              showRawJson ? (
                <pre className={styles.jsonPre}>{JSON.stringify(conditionData, null, 2)}</pre>
              ) : (
                <ConditionRenderer conditionData={conditionData} />
              )
            ) : (
              <span className={styles.dimText}>No conditions set</span>
            )}
          </div>
        </div>

        {/* ── Signatories (with cross-cohort overlap) ─────────────────── */}
        <div className={styles.signaturesSection}>
          <div className={styles.infoCardTitle}>
            Signatories
            {cohort?.signatures?.length > 0 && (
              <span className={styles.infoCardCount}>{cohort.signatures.length}</span>
            )}
          </div>
          {cohort?.signatures?.length > 0 ? (
            <table className={styles.table}>
              <thead><tr>
                <th>#</th>
                <th>Provider</th>
                <th>Signer</th>
                <th>Cohorts</th>
                <th>Time</th>
                <th>Tx</th>
              </tr></thead>
              <tbody>
                {cohort.signatures.map((sig, idx) => {
                  const otherCohorts = (cohort.providerCohortMap?.[sig.provider?.toLowerCase()] || [])
                    .filter(cId => cId !== cohort.id);
                  return (
                    <tr key={idx}>
                      <td className={styles.idxCell}>{idx + 1}</td>
                      <td>
                        <a href={`/address/${sig.provider}`} className={styles.addrLink}>{formatString(sig.provider)}</a>
                      </td>
                      <td className={styles.monoCell}>{formatString(sig.signer)}</td>
                      <td className={styles.overlapCell}>
                        {otherCohorts.length > 0 ? (
                          <span className={styles.overlapBadges}>
                            {otherCohorts.slice(0, 4).map(cId => (
                              <a key={cId} href={`/cohort/${cId}`} className={styles.overlapLink}>#{cId}</a>
                            ))}
                            {otherCohorts.length > 4 && (
                              <span className={styles.overlapMore}>+{otherCohorts.length - 4}</span>
                            )}
                          </span>
                        ) : (
                          <span className={styles.dimCell}>—</span>
                        )}
                      </td>
                      <td className={styles.ageCell}>{sig.timestamp ? formatTimeToText(parseInt(sig.timestamp) * 1000) : '—'}</td>
                      <td>
                        {sig.transactionHash ? (
                          <a href={`https://basescan.org/tx/${sig.transactionHash}`} target="_blank" rel="noopener noreferrer" className={styles.addrLink}>
                            {formatString(sig.transactionHash)}
                          </a>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : <div className={styles.emptyTab}>No signatures recorded</div>}
        </div>

        {/* ── Op Executions (Base chain deployment ops) ────────────────── */}
        {cohort?.opExecutions?.length > 0 && (
          <div className={styles.signaturesSection}>
            <div className={styles.infoCardTitle}>
              Operations
              <span className={styles.infoCardCount}>{cohort.opExecutions.length}</span>
            </div>
            <table className={styles.table}>
              <thead><tr>
                <th>#</th>
                <th>Target</th>
                <th>Result</th>
                <th>Gas</th>
                <th>Time</th>
                <th>Tx</th>
              </tr></thead>
              <tbody>
                {cohort.opExecutions.map((op, idx) => (
                  <tr key={idx}>
                    <td className={styles.idxCell}>{idx + 1}</td>
                    <td>
                      <a href={`https://basescan.org/address/${op.target}`} target="_blank" rel="noopener noreferrer" className={styles.addrLink}>
                        {short(op.target)}
                      </a>
                    </td>
                    <td>
                      <span className={`${styles.resultBadge} ${op.result === 'true' || op.result === true ? styles.resultOk : styles.resultFail}`}>
                        {op.result === 'true' || op.result === true ? 'OK' : 'Fail'}
                      </span>
                    </td>
                    <td className={styles.dimCell}>{op.gasUsed ? parseInt(op.gasUsed).toLocaleString() : '—'}</td>
                    <td className={styles.ageCell}>{op.timestamp ? formatTimeToText(parseInt(op.timestamp) * 1000) : '—'}</td>
                    <td>
                      {op.transactionHash ? (
                        <a href={`https://basescan.org/tx/${op.transactionHash}`} target="_blank" rel="noopener noreferrer" className={styles.addrLink}>
                          {formatString(op.transactionHash)}
                        </a>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className={styles.footer}>
          <button onClick={() => navigate("/cohorts")} className={styles.backBtn}>← Action Control</button>
        </div>
      </div>
    </div>
  );
};

export default SigningCohortDetail;
