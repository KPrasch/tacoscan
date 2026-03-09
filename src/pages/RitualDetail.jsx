import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import * as Data from './data';
import styles from './RitualDetail.module.css';
import { RitualManagement } from '../components/RitualManagement';
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

// Group formation events into summary
function summarizeFormation(transactions) {
  const milestones = []; // non-participant events (initiate, start, extended)
  let transcriptCount = 0;
  let aggregationCount = 0;
  let firstTxTime = null;
  let lastTxTime = null;

  for (const tx of transactions) {
    const t = tx.eventType || tx.description || '';
    const ts = tx.timestamp;
    if (ts && (!firstTxTime || ts < firstTxTime)) firstTxTime = ts;
    if (ts && (!lastTxTime || ts > lastTxTime)) lastTxTime = ts;

    if (t === 'TRANSCRIPT_POSTED') {
      transcriptCount++;
    } else if (t === 'AGGREGATION_POSTED') {
      aggregationCount++;
    } else {
      milestones.push(tx);
    }
  }
  return { milestones, transcriptCount, aggregationCount, firstTxTime, lastTxTime };
}

const RitualDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ritual, setRitual] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
            <Link to="/rituals" className={styles.breadLink}>← Access Control</Link>
            <span>Ritual #{id} not found.</span>
          </div>
        </div>
      </div>
    );
  }

  const formation = summarizeFormation(ritual.transactions || []);
  const stateClass = STATUS_CLASS[ritual.status?.toUpperCase()] || '';

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* ── Header row ── */}
        <div className={styles.headerRow}>
          <div className={styles.breadcrumb}>
            <Link to="/rituals" className={styles.breadLink}>Access Control</Link>
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

        {/* ── Info grid: Identity | Fee Model | Access Control ── */}
        <div className={styles.infoGrid}>

          {/* Identity */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardTitle}>Identity</div>
            <KV label="ID" mono>{ritual.id}</KV>
            <KV label="Threshold" mono>
              {ritual.threshold ? `${ritual.threshold} of ${ritual.totalParticipants}` : `— of ${ritual.totalParticipants}`}
            </KV>
            <KV label="Authority" mono>
              {ritual.authority
                ? <a href={`https://polygonscan.com/address/${ritual.authority}`} target="_blank" rel="noopener noreferrer" className={styles.addrLink}>{short(ritual.authority)}</a>
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

          {/* Fee Model */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardTitle}>Fee Model</div>
            <RitualManagement ritual={ritual} section="feeModel" />
          </div>

          {/* Access Control */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardTitle}>
              Access Control
              {ritual.accessControls?.length > 0 && (
                <span className={styles.infoCardCount}>{ritual.accessControls.length}</span>
              )}
            </div>
            <RitualManagement ritual={ritual} section="encryptors" />
            {ritual.accessControls?.length > 0 && (
              <div className={styles.acRecords}>
                <div className={styles.acRecordsLabel}>Records</div>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Address</th>
                      <th>Auth</th>
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
          </div>
        </div>

        {/* ── Subscription timeline + periods ── */}
        <div className={styles.subscriptionSection}>
          <RitualManagement ritual={ritual} section="timeline" />
        </div>

        {/* ── Participants (full width) ── */}
        <div className={`${styles.infoCard} ${styles.participantsSection}`}>
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

        {/* ── Formation summary + Handovers (inline, no tabs) ── */}
        <div className={styles.bottomGrid}>

          {/* Formation summary */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardTitle}>
              Formation
              <span className={styles.infoCardCount}>{(ritual.transactions || []).length} events</span>
            </div>

            {/* Progress bars for transcript/aggregation (already in participants, but show progress) */}
            <div className={styles.formationProgress}>
              <div className={styles.progressRow}>
                <span className={styles.progressLabel}>Transcripts</span>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${ritual.totalParticipants ? (formation.transcriptCount / ritual.totalParticipants) * 100 : 0}%` }} />
                </div>
                <span className={styles.progressCount}>{formation.transcriptCount}/{ritual.totalParticipants}</span>
              </div>
              <div className={styles.progressRow}>
                <span className={styles.progressLabel}>Aggregations</span>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${ritual.totalParticipants ? (formation.aggregationCount / ritual.totalParticipants) * 100 : 0}%` }} />
                </div>
                <span className={styles.progressCount}>{formation.aggregationCount}/{ritual.totalParticipants}</span>
              </div>
            </div>

            {/* Milestone events only */}
            {formation.milestones.length > 0 && (
              <div className={styles.milestoneList}>
                {formation.milestones.map((tx, idx) => (
                  <div key={idx} className={styles.milestoneRow}>
                    <span className={styles.milestoneDot} />
                    <span className={styles.milestoneEvent}>{(tx.description || tx.eventType || '').replace(/_/g, ' ')}</span>
                    {tx.txHash && (
                      <a href={`https://polygonscan.com/tx/${tx.txHash}`} target="_blank" rel="noopener noreferrer" className={styles.addrLink}>
                        {tx.txHash.slice(0, 8)}…
                      </a>
                    )}
                    <span className={styles.ageCell}>
                      {tx.timestamp ? new Date(tx.timestamp * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {formation.firstTxTime && formation.lastTxTime && formation.firstTxTime !== formation.lastTxTime && (
              <div className={styles.formationSpan}>
                {new Date(formation.firstTxTime * 1000).toLocaleDateString()} — {new Date(formation.lastTxTime * 1000).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Handovers */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardTitle}>
              Handovers
              {ritual.handovers?.length > 0 && (
                <span className={styles.infoCardCount}>{ritual.handovers.length}</span>
              )}
            </div>
            {ritual.handovers?.length > 0 ? (
              <div className={styles.handoverList}>
                {ritual.handovers.map((h, idx) => (
                  <div key={idx} className={styles.handoverRow}>
                    <div className={styles.handoverPassoff}>
                      <Link to={`/node/${h.departingParticipant}`} className={styles.addrLink}>{short(h.departingParticipant)}</Link>
                      <span className={styles.handoverArrow}>→</span>
                      <Link to={`/node/${h.incomingParticipant}`} className={styles.addrLink}>{short(h.incomingParticipant)}</Link>
                    </div>
                    <div className={styles.handoverMeta}>
                      <span className={`${styles.resultBadge} ${
                        h.status === 'FINALIZED' ? styles.resultOk
                        : h.status === 'CANCELED' ? styles.resultFail
                        : styles.resultPending
                      }`}>
                        {h.status?.replace(/_/g, ' ')}
                      </span>
                      <span className={styles.ageCell}>
                        {h.requestedAt ? new Date(parseInt(h.requestedAt) * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric' }) : ''}
                        {h.finalizedAt ? ` → ${new Date(parseInt(h.finalizedAt) * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyTab}>No handovers</div>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.backBtn} onClick={() => navigate('/rituals')}>← Back to Rituals</button>
        </div>
      </div>
    </div>
  );
};

export default RitualDetail;
