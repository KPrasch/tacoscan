import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import * as Data from './data';
import styles from './RitualDetail.module.css';
import { RitualManagement } from '../components/RitualManagement';
import FormationTimeline from '../components/FormationTimeline';
import { PageSkeleton } from '../components/Skeleton';

const short = (addr) => addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '—';

const STATUS_CLASS = {
  'SUCCESSFUL':                 'state_successful',
  'ACTIVE':                     'state_active',
  'DKG AWAITING TRANSCRIPTS':   'state_awaiting',
  'DKG AWAITING AGGREGATIONS':  'state_awaiting',
  'EXPIRED':                    'state_expired',
  'TIME OUT':                   'state_timeout',
  'DKG INVALID':                'state_timeout',
  'DKG ERROR':                  'state_timeout',
  'TIMEOUT':                    'state_timeout',
};

function KV({ label, children, mono }) {
  return (
    <div className={styles.kv}>
      <span className={styles.kvLabel}>{label}</span>
      <span className={`${styles.kvValue}${mono ? ' ' + styles.kvMono : ''}`}>{children}</span>
    </div>
  );
}

const TABS = ['formation', 'subscription', 'authorizations', 'handovers'];

const RitualDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ritual, setRitual] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('formation');

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setIsLoading(true);
        const data = await Data.getRituals(true, id);
        if (data?.rituals?.length > 0) {
          const timeout = await Data.getTimeout();
          const formatted = Data.formatRitualsData(data.rituals, timeout)[0];
          const onChain = await Data.getRitualOnChainData(id);
          if (onChain) {
            formatted.feeModel = onChain.feeModel;
            formatted.accessController = onChain.accessController || formatted.accessController;
            if (onChain.threshold) formatted.threshold = onChain.threshold;
          }
          try {
            formatted.accessControls = await Data.getRitualAccessControls(id);
          } catch {
            formatted.accessControls = [];
          }
          setRitual(formatted);
        } else {
          setRitual(null);
        }
      } catch (err) {
        console.error('Error fetching ritual:', err);
        setRitual(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  if (isLoading) return <PageSkeleton />;

  if (!ritual) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.errorBox}>
            <Link to="/rituals" className={styles.breadLink}>← DKG Rituals</Link>
            <span>Ritual #{id} not found.</span>
          </div>
        </div>
      </div>
    );
  }

  const tabCount = (tab) => {
    if (tab === 'formation') return (ritual.transactions || []).length || null;
    if (tab === 'authorizations') return (ritual.accessControls || []).length || null;
    if (tab === 'handovers') return (ritual.handovers || []).length || null;
    return null;
  };

  const stateClass = STATUS_CLASS[ritual.status?.toUpperCase()] || '';

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* ── Header row ── */}
        <div className={styles.headerRow}>
          <div className={styles.breadcrumb}>
            <Link to="/rituals" className={styles.breadLink}>DKG Rituals</Link>
            <span className={styles.sep}>/</span>
            <span className={styles.breadCurrent}>Ritual #{ritual.id}</span>
            {ritual.isHeartbeat && (
              <span className={`${styles.statePill} ${styles.pillHeartbeat}`}>heartbeat</span>
            )}
          </div>
          <div className={styles.headerMeta}>
            <span className={`${styles.statePill} ${styles[stateClass]}`}>{ritual.status}</span>
            {ritual.threshold > 0 && (
              <>
                <span className={styles.metaDot}>·</span>
                <span className={styles.metaItem}>{ritual.threshold} of {ritual.totalParticipants}</span>
              </>
            )}
            <span className={styles.metaDot}>·</span>
            <span className={styles.metaAge}>{Data.calculateTimeMoment(ritual.initTimeStamp)}</span>
          </div>
        </div>

        {/* ── Info grid: Identity | Participants ── */}
        <div className={styles.infoGrid}>

          {/* Identity KVs */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardTitle}>Identity</div>
            <KV label="ID" mono>{ritual.id}</KV>
            <KV label="Threshold" mono>
              {ritual.threshold ? `${ritual.threshold} of ${ritual.totalParticipants}` : `— of ${ritual.totalParticipants}`}
            </KV>
            <KV label="Transcripts" mono>{ritual.totalPostedTranscripts} / {ritual.totalParticipants}</KV>
            <KV label="Aggregations" mono>{ritual.totalPostedAggregations} / {ritual.totalParticipants}</KV>
            <KV label="Authority" mono>
              {ritual.authority
                ? <a href={`https://polygonscan.com/address/${ritual.authority}`} target="_blank" rel="noopener noreferrer" className={styles.addrLink}>{short(ritual.authority)}</a>
                : '—'}
            </KV>
            <KV label="Access Ctrl" mono>
              {ritual.accessController
                ? <a href={`https://polygonscan.com/address/${ritual.accessController}`} target="_blank" rel="noopener noreferrer" className={styles.addrLink}>{short(ritual.accessController)}</a>
                : '—'}
            </KV>
            <KV label="Fee Model" mono>
              {ritual.feeModel
                ? <a href={`https://polygonscan.com/address/${ritual.feeModel}`} target="_blank" rel="noopener noreferrer" className={styles.addrLink}>{short(ritual.feeModel)}</a>
                : '—'}
            </KV>
            {ritual.publicKey && (
              <KV label="Pub Key" mono>
                <span title={ritual.publicKey}>{ritual.publicKey.slice(0, 18)}…</span>
              </KV>
            )}
            <KV label="Created">{new Date(ritual.initTimeStamp).toLocaleString()}</KV>
            {ritual.endTimeStamp > 0 && (
              <KV label="Ended">{new Date(ritual.endTimeStamp).toLocaleString()}</KV>
            )}
          </div>

          {/* Participants inline table */}
          <div className={`${styles.infoCard} ${styles.participantsCard}`}>
            <div className={styles.infoCardTitle}>
              Participants
              <span className={styles.infoCardCount}>{ritual.totalParticipants}</span>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.idxCell}>#</th>
                  <th>Provider</th>
                  <th>Operator</th>
                  <th>Transcript</th>
                  <th>Aggregation</th>
                </tr>
              </thead>
              <tbody>
                {(ritual.participants || []).map((participant, i) => {
                  const hasTx  = ritual.transcripts?.includes(participant);
                  const hasAgg = ritual.aggregations?.includes(participant);
                  const op     = ritual.operatorAddresses?.[participant];
                  return (
                    <tr key={participant}>
                      <td className={styles.idxCell}>{i + 1}</td>
                      <td>
                        <Link to={`/node/${participant}`} className={styles.addrLink}>
                          {short(participant)}
                        </Link>
                      </td>
                      <td>
                        {op && op !== '-'
                          ? <Link to={`/node/${op}`} className={styles.addrLink}>{short(op)}</Link>
                          : <span className={styles.dimCell}>—</span>}
                      </td>
                      <td>
                        <span className={`${styles.resultBadge} ${hasTx ? styles.resultOk : styles.resultPending}`}>
                          {hasTx ? '✓' : '○'}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.resultBadge} ${hasAgg ? styles.resultOk : styles.resultPending}`}>
                          {hasAgg ? '✓' : '○'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className={styles.tabs}>
          {TABS.map((t) => {
            const count = tabCount(t);
            return (
              <button
                key={t}
                className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {count !== null && <span className={styles.tabBadge}>{count}</span>}
              </button>
            );
          })}
        </div>

        <div className={styles.tabBody}>
          {activeTab === 'formation' && (
            <FormationTimeline transactions={ritual.transactions || []} />
          )}

          {activeTab === 'subscription' && (
            <RitualManagement ritual={ritual} defaultTab="subscription" />
          )}

          {activeTab === 'authorizations' && (
            <>
              <RitualManagement ritual={ritual} defaultTab="encryptors" />
              {ritual.accessControls?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div className={styles.infoCardTitle} style={{ marginBottom: 8 }}>
                    Access Control Records
                  </div>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Address</th>
                        <th>Authorized</th>
                        <th>Tx</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ritual.accessControls.map((ac, idx) => (
                        <tr key={idx}>
                          <td>
                            <a href={`https://polygonscan.com/address/${ac.address}`} target="_blank" rel="noopener noreferrer" className={styles.addrLink}>
                              {short(ac.address)}
                            </a>
                          </td>
                          <td>
                            <span className={`${styles.resultBadge} ${ac.isAuthorized ? styles.resultOk : styles.resultFail}`}>
                              {ac.isAuthorized ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className={styles.monoCell}>
                            {ac.transactionHash
                              ? <a href={`https://polygonscan.com/tx/${ac.transactionHash}`} target="_blank" rel="noopener noreferrer" className={styles.addrLink}>{ac.transactionHash.slice(0, 10)}…</a>
                              : '—'}
                          </td>
                          <td className={styles.ageCell}>
                            {ac.timestamp ? new Date(parseInt(ac.timestamp) * 1000).toLocaleString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === 'handovers' && (
            ritual.handovers?.length > 0 ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Departing</th>
                    <th>Incoming</th>
                    <th>Status</th>
                    <th>Requested</th>
                    <th>Finalized</th>
                  </tr>
                </thead>
                <tbody>
                  {ritual.handovers.map((h, idx) => (
                    <tr key={idx}>
                      <td><Link to={`/node/${h.departingParticipant}`} className={styles.addrLink}>{short(h.departingParticipant)}</Link></td>
                      <td><Link to={`/node/${h.incomingParticipant}`} className={styles.addrLink}>{short(h.incomingParticipant)}</Link></td>
                      <td>
                        <span className={`${styles.resultBadge} ${
                          h.status === 'FINALIZED' ? styles.resultOk
                          : h.status === 'CANCELED' ? styles.resultFail
                          : styles.resultPending
                        }`}>
                          {h.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className={styles.ageCell}>{h.requestedAt ? new Date(parseInt(h.requestedAt) * 1000).toLocaleString() : '—'}</td>
                      <td className={styles.ageCell}>{h.finalizedAt ? new Date(parseInt(h.finalizedAt) * 1000).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={styles.emptyTab}>No handovers for this ritual.</div>
            )
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.backBtn} onClick={() => navigate('/rituals')}>← Back to Rituals</button>
        </div>
      </div>
    </div>
  );
};

export default RitualDetail;
