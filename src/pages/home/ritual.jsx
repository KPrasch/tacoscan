import React, {useState, useEffect, useMemo} from "react";
import { Link, useNavigate } from 'react-router-dom';
import * as Data from "../data";
import { getFeeModelInfo, getAccessControllerInfo } from '../../utils/contractRegistry';
import styles from './styles.module.css'
import PageHeader from '../../components/PageHeader'
import { SkeletonRows } from '../../components/Skeleton'

const RitualPage = ({network = 'polygon', isSearch = false, searchInput = '', defaultView = 'rituals'} = {}) => {
    const [pageData, setPageData] = useState({
        rowData: [],
        isLoading: true,
        pageNumber: 1,
        ritualCounter: {},
    });
    const [hasLoaded, setHasLoaded] = useState(false);
    const [statusFilter, setStatusFilter] = useState('active');
    const navigate = useNavigate();
    const [sortBy, setSortBy] = useState('id');
    const [sortOrder, setSortOrder] = useState('desc');
    const [activeView, setActiveView] = useState(defaultView);

    // Heartbeat state
    const [hbGroups, setHbGroups] = useState([]);
    const [allHeartbeats, setAllHeartbeats] = useState([]);
    const [hbLoading, setHbLoading] = useState(true);

    // RPC on-chain data (loaded progressively): { ritualId: { threshold, feeModel, accessController } }
    const [onChainData, setOnChainData] = useState({});

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };
    const sortInd = (field) => sortBy === field ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : '';

    const STATUS_SHORT = {
        'SUCCESSFUL':                'Successful',
        'ACTIVE':                    'Active',
        'DKG AWAITING TRANSCRIPTS':  'Awaiting TX',
        'DKG AWAITING AGGREGATIONS': 'Awaiting Agg',
        'EXPIRED':                   'Expired',
        'TIME OUT':                  'Time Out',
        'DKG INVALID':               'Invalid',
        'DKG ERROR':                 'Error',
        'TIMEOUT':                   'Timeout',
    };
    const statusClass = (status) => {
        const s = (status || '').toUpperCase();
        if (s === 'SUCCESSFUL') return styles.status_successful;
        if (s === 'ACTIVE') return styles.status_active;
        if (s.includes('AWAITING')) return styles.status_awaiting;
        if (s === 'EXPIRED') return styles.status_expired;
        if (s.includes('TIME') || s.includes('INVALID') || s.includes('ERROR') || s === 'TIMEOUT') return styles.status_timeout;
        return '';
    };

    const sortedData = useMemo(() => {
        const d = [...pageData.rowData];
        d.sort((a, b) => {
            let aVal, bVal;
            switch (sortBy) {
                case 'id':           aVal = parseInt(a.id); bVal = parseInt(b.id); break;
                case 'participants': aVal = a.totalParticipants; bVal = b.totalParticipants; break;
                case 'threshold':    aVal = onChainData[a.id]?.threshold || a.threshold || 0; bVal = onChainData[b.id]?.threshold || b.threshold || 0; break;
                case 'transcripts':  aVal = a.totalPostedTranscripts; bVal = b.totalPostedTranscripts; break;
                case 'aggregations': aVal = a.totalPostedAggregations; bVal = b.totalPostedAggregations; break;
                case 'updateTime':   aVal = a.updateTime; bVal = b.updateTime; break;
                default: {
                    const av = String(a[sortBy] || ''), bv = String(b[sortBy] || '');
                    return sortOrder === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
                }
            }
            const diff = aVal - bVal;
            return sortOrder === 'asc' ? diff : -diff;
        });
        return d;
    }, [pageData.rowData, sortBy, sortOrder, onChainData]);

    // Fetch rituals
    useEffect(() => {
        setPageData((prev) => ({ ...prev, isLoading: true }));

        Data.getRituals(isSearch, searchInput).then(async (info) => {
            if(info?.rituals === undefined){
                setPageData({
                    isLoading: false,
                    rowData: [],
                    ritualCounter: {},
                });
            } else {
                const [timeout, liveRitualIds] = await Promise.all([
                    Data.getTimeout(),
                    Data.getLiveRitualIds().catch(() => new Set()),
                ]);
                const formattedData = Data.formatRitualsData(info.rituals, timeout, liveRitualIds);

                // Filter out heartbeats (they show in the heartbeats tab)
                let filteredData = formattedData.filter(ritual => !ritual.isHeartbeat);

                // Apply status filter
                if (statusFilter !== 'all') {
                    switch (statusFilter) {
                        case 'active':
                            filteredData = filteredData.filter(r => r.status === 'SUCCESSFUL' || r.status === 'ACTIVE');
                            break;
                        case 'dkg':
                            filteredData = filteredData.filter(r =>
                                r.status === 'DKG AWAITING TRANSCRIPTS' ||
                                r.status === 'DKG AWAITING AGGREGATIONS'
                            );
                            break;
                        case 'expired':
                            filteredData = filteredData.filter(r =>
                                r.status === 'DKG INVALID' ||
                                r.status === 'DKG ERROR' ||
                                r.status === 'TIMEOUT' ||
                                r.status === 'EXPIRED' ||
                                r.status === 'TIME OUT'
                            );
                            break;
                    }
                }

                // Calculate counts for display (non-heartbeat only)
                const dataForCounts = formattedData.filter(r => !r.isHeartbeat);

                const activeCount = dataForCounts.filter(r =>
                    r.status === 'SUCCESSFUL' || r.status === 'ACTIVE'
                ).length;

                const dkgCount = dataForCounts.filter(r =>
                    r.status === 'DKG AWAITING TRANSCRIPTS' ||
                    r.status === 'DKG AWAITING AGGREGATIONS'
                ).length;

                const expiredCount = dataForCounts.filter(r =>
                    r.status === 'TIME OUT' ||
                    r.status === 'EXPIRED' ||
                    r.status === 'DKG INVALID' ||
                    r.status === 'DKG ERROR' ||
                    r.status === 'TIMEOUT'
                ).length;

                const totalCount = dataForCounts.length;

                setPageData({
                    isLoading: false,
                    rowData: filteredData,
                    ritualCounter: {
                        total: totalCount,
                        active: activeCount,
                        dkg: dkgCount,
                        expired: expiredCount
                    },
                });
                setHasLoaded(true);

                // Also process heartbeats from same data
                const heartbeatRituals = formattedData.filter(r => r.isHeartbeat);
                setAllHeartbeats(heartbeatRituals);
                const detected = Data.detectHeartbeatGroups(formattedData, timeout);
                detected.sort((a, b) => new Date(b.mondayMidnight) - new Date(a.mondayMidnight));
                setHbGroups(detected);
                setHbLoading(false);

                // Fetch on-chain data from RPC (progressive, non-blocking)
                const ritualIds = dataForCounts.map(r => r.id);
                Data.getBatchRitualOnChainData(ritualIds).then(d => setOnChainData(d)).catch(() => {});
            }

        }).catch((err) => {
            console.error('Failed to load rituals:', err);
            setPageData({ isLoading: false, rowData: [], ritualCounter: {} });
            setHbLoading(false);
        });

    }, [network, isSearch, statusFilter]);

    // Heartbeat stats
    const hbStats = useMemo(() => {
        const totalRituals = allHeartbeats.length;
        const successful = allHeartbeats.filter(r => r.status === "SUCCESSFUL" || r.status === "ACTIVE").length;
        const failed = allHeartbeats.filter(r => r.status === "TIME OUT" || r.status === "FAILED").length;
        const successRate = totalRituals > 0 ? ((successful / totalRituals) * 100).toFixed(1) : "0.0";
        const allParticipants = new Set();
        allHeartbeats.forEach(r => r.participants?.forEach(p => allParticipants.add(p)));
        return { totalGroups: hbGroups.length, totalRituals, successful, failed, successRate, uniqueParticipants: allParticipants.size };
    }, [hbGroups, allHeartbeats]);

    // Heartbeat heatmap data
    const weeklyData = useMemo(() => {
        const weekMap = {};
        allHeartbeats.forEach(r => {
            const ts = r.initTimeStamp || r.startedAt;
            if (!ts) return;
            const d = new Date(ts);
            const day = d.getDay();
            const monday = new Date(d);
            monday.setDate(d.getDate() - ((day + 6) % 7));
            const key = monday.toISOString().split('T')[0];
            if (!weekMap[key]) weekMap[key] = { total: 0, successful: 0, failed: 0 };
            weekMap[key].total++;
            if (r.status === "SUCCESSFUL" || r.status === "ACTIVE") weekMap[key].successful++;
            else weekMap[key].failed++;
        });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const start = new Date(today);
        start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - 51 * 7);
        const weeks = [];
        for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 7)) {
            const key = d.toISOString().split('T')[0];
            weeks.push({ week: key, ...(weekMap[key] || { total: 0, successful: 0, failed: 0 }) });
        }
        return weeks;
    }, [allHeartbeats]);

    const maxCount = useMemo(() => Math.max(1, ...weeklyData.map(w => w.total)), [weeklyData]);

    const getHeatColor = (count, failed) => {
        if (count === 0) return 'var(--bg-tertiary)';
        if (failed > 0) {
            const ratio = failed / count;
            if (ratio > 0.5) return '#dc2626';
            if (ratio > 0.2) return '#f59e0b';
        }
        const intensity = Math.min(count / maxCount, 1);
        if (intensity < 0.25) return '#86efac';
        if (intensity < 0.5) return '#4ade80';
        if (intensity < 0.75) return '#22c55e';
        return '#16a34a';
    };

    const formatWeekDate = (mondayMidnight) => {
        if (!mondayMidnight) return "Unknown";
        const d = new Date(mondayMidnight);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    // Shared filter button style factory
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
        whiteSpace: 'nowrap'
    });

    const viewBtn = (active) => ({
        padding: '5px 14px',
        background: active ? 'var(--bg-surface)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
        border: active ? '1px solid var(--border-color)' : '1px solid transparent',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: active ? 700 : 500,
        fontFamily: 'var(--font-mono)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        letterSpacing: '0.3px',
        textTransform: 'uppercase',
    });

    const SQ = 6, GAP = 2, STRIDE = SQ + GAP;
    const svgW = weeklyData.length * STRIDE - GAP;
    const svgH = SQ;

    const headerStats = activeView === 'rituals'
        ? [
            { label: 'Total',          value: pageData.ritualCounter?.total   ?? (hasLoaded ? 0 : '—') },
            { label: 'Active',         value: pageData.ritualCounter?.active  ?? (hasLoaded ? 0 : '—') },
            { label: 'DKG In Progress', value: pageData.ritualCounter?.dkg    ?? (hasLoaded ? 0 : '—') },
            { label: 'Expired',        value: pageData.ritualCounter?.expired ?? (hasLoaded ? 0 : '—') },
        ]
        : [
            { label: 'Weekly Groups', value: hbStats.totalGroups },
            { label: 'Total Rituals', value: hbStats.totalRituals },
            { label: 'Success Rate',  value: `${hbStats.successRate}%` },
            { label: 'Participants',  value: hbStats.uniqueParticipants },
        ];

    return (
        <div style={{
            background: 'var(--bg-primary)',
            minHeight: '100vh',
            paddingBottom: '60px'
        }}>
            <div style={{
                maxWidth: '1600px',
                margin: '0 auto',
                padding: '16px 20px'
            }}>

                <PageHeader
                    title={isSearch ? `Search: ${searchInput}` : 'Access Control'}
                    subtitle={isSearch ? undefined : 'DKG rituals powering threshold access control'}
                    stats={headerStats}
                />

                {/* View toggle + filters row */}
                {!isSearch && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px',
                        flexWrap: 'wrap',
                        gap: '8px'
                    }}>
                        {/* Left: view toggle */}
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <button onClick={() => setActiveView('rituals')} style={viewBtn(activeView === 'rituals')}>
                                Rituals ({pageData.ritualCounter?.total ?? 0})
                            </button>
                            <button onClick={() => setActiveView('heartbeats')} style={viewBtn(activeView === 'heartbeats')}>
                                Heartbeats ({hbStats.totalGroups})
                            </button>

                            {/* Status filters (rituals view only) */}
                            {activeView === 'rituals' && (
                                <div style={{ display: 'flex', gap: '6px', marginLeft: '12px', borderLeft: '1px solid var(--border-color)', paddingLeft: '12px' }}>
                                    <button onClick={() => setStatusFilter('all')} style={filterBtn(statusFilter === 'all')}>
                                        All ({pageData.ritualCounter?.total ?? 0})
                                    </button>
                                    <button onClick={() => setStatusFilter('active')} style={filterBtn(statusFilter === 'active')}>
                                        Active ({pageData.ritualCounter?.active ?? 0})
                                    </button>
                                    <button onClick={() => setStatusFilter('dkg')} style={filterBtn(statusFilter === 'dkg')}>
                                        DKG In Progress ({pageData.ritualCounter?.dkg ?? 0})
                                    </button>
                                    <button onClick={() => setStatusFilter('expired')} style={filterBtn(statusFilter === 'expired')}>
                                        Expired ({pageData.ritualCounter?.expired ?? 0})
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Search-only: just status filters */}
                {isSearch && (
                    <div style={{
                        display: 'flex',
                        gap: '6px',
                        marginBottom: '12px',
                        flexWrap: 'wrap',
                        alignItems: 'center'
                    }}>
                        <button onClick={() => setStatusFilter('all')} style={filterBtn(statusFilter === 'all')}>
                            All ({pageData.ritualCounter?.total ?? 0})
                        </button>
                        <button onClick={() => setStatusFilter('active')} style={filterBtn(statusFilter === 'active')}>
                            Active ({pageData.ritualCounter?.active ?? 0})
                        </button>
                        <button onClick={() => setStatusFilter('dkg')} style={filterBtn(statusFilter === 'dkg')}>
                            DKG In Progress ({pageData.ritualCounter?.dkg ?? 0})
                        </button>
                        <button onClick={() => setStatusFilter('expired')} style={filterBtn(statusFilter === 'expired')}>
                            Expired ({pageData.ritualCounter?.expired ?? 0})
                        </button>
                    </div>
                )}

                {/* ── Rituals view ──────────────────────────────────────────── */}
                {activeView === 'rituals' && (
                    <div className={`${styles.tableContainer}${pageData.isLoading && hasLoaded ? ' ' + styles.tableLoading : ''}`}>
                        <table className={styles.ritualTable}>
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort('id')} className={styles.sortable}>#{ sortInd('id')}</th>
                                    <th onClick={() => handleSort('authority')} className={styles.sortable}>Authority{sortInd('authority')}</th>
                                    <th onClick={() => handleSort('threshold')} className={styles.sortable}>Threshold{sortInd('threshold')}</th>
                                    <th onClick={() => handleSort('transcripts')} className={styles.sortable}>DKG{sortInd('transcripts')}</th>
                                    <th onClick={() => handleSort('status')} className={styles.sortable}>Status{sortInd('status')}</th>
                                    <th onClick={() => handleSort('updateTime')} className={styles.sortable}>Updated{sortInd('updateTime')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageData.isLoading && !hasLoaded ? (
                                    <SkeletonRows rows={10} cols={6} />
                                ) : sortedData.length === 0 && !pageData.isLoading ? (
                                    <tr><td colSpan={6} className={styles.tableEmpty}>No rituals</td></tr>
                                    ) : sortedData.map((ritual) => {
                                        const rpc = onChainData[ritual.id];
                                        const threshold = rpc?.threshold || ritual.threshold;
                                        const fm = rpc?.feeModel ? getFeeModelInfo(rpc.feeModel) : null;
                                        const ac = rpc?.accessController ? getAccessControllerInfo(rpc.accessController) : null;
                                        const dkgComplete = ritual.totalPostedTranscripts === ritual.totalParticipants
                                            && ritual.totalPostedAggregations === ritual.totalParticipants;
                                        // Lifecycle: Active (DKG done, not expired), Expired, or DKG status
                                        const isExpired = ritual.status === 'EXPIRED' || ritual.status === 'TIME OUT' || ritual.status === 'TIMEOUT';
                                        const isDkgDone = ritual.status === 'SUCCESSFUL' || ritual.status === 'ACTIVE';
                                        const lifecycleStatus = isExpired ? 'EXPIRED'
                                            : isDkgDone ? 'ACTIVE'
                                            : ritual.status;
                                        const lifecycleLabel = isExpired ? 'Expired'
                                            : isDkgDone ? 'Active'
                                            : (STATUS_SHORT[ritual.status] || ritual.status);
                                        return (
                                        <tr
                                            key={ritual.id}
                                            className={styles.clickableRow}
                                            onClick={() => navigate(`/rituals/${ritual.id}`)}
                                        >
                                            <td className={styles.ritualIdCell}>{ritual.id}</td>
                                            <td className={styles.addrCell}>
                                                <div>{Data.formatString(ritual.authority)}</div>
                                                <div className={styles.rowBadges}>
                                                    {fm && fm.type !== 'free' && (
                                                        <span className={`${styles.rowBadge} ${styles.badgeFee}`}>{fm.displayName}</span>
                                                    )}
                                                    {ac && (
                                                        <span className={`${styles.rowBadge} ${styles.badgeAc}`}>{ac.displayName}</span>
                                                    )}
                                                    {rpc?.usedSlots != null && rpc?.maxNodes != null && (
                                                        <span className={`${styles.rowBadge} ${styles.badgeSlots}`}>{rpc.usedSlots}/{rpc.maxNodes} slots</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className={styles.numCell}>
                                                {threshold
                                                    ? `${threshold} of ${ritual.totalParticipants}`
                                                    : `— of ${ritual.totalParticipants}`}
                                            </td>
                                            <td className={dkgComplete ? styles.progressFull : styles.progressPartial}>
                                                {ritual.totalPostedTranscripts}/{ritual.totalParticipants} tx · {ritual.totalPostedAggregations}/{ritual.totalParticipants} agg
                                            </td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${statusClass(lifecycleStatus)}`}>
                                                    {lifecycleLabel}
                                                </span>
                                            </td>
                                            <td className={styles.dimCell}>{Data.calculateTimeMoment(ritual.updateTime)}</td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                )}

                {/* ── Heartbeats view ───────────────────────────────────────── */}
                {activeView === 'heartbeats' && (
                    <>
                        {/* Heatmap */}
                        <div className={styles.heatmapSection}>
                            <div className={styles.heatmapHeader}>
                                <span className={styles.heatmapTitle}>Heartbeat activity — last 52 weeks</span>
                                <div className={styles.heatmapLegend}>
                                    {[['#22c55e','Successful'],['#f59e0b','Partial'],['#dc2626','Failed']].map(([color, label]) => (
                                        <span key={label} className={styles.legendItem}>
                                            <svg width={7} height={7} style={{ flexShrink: 0 }}>
                                                <rect width={7} height={7} rx={1} fill={color} opacity={0.85} />
                                            </svg>
                                            {label}
                                        </span>
                                    ))}
                                    <span className={styles.legendRight}>← older · newer →</span>
                                </div>
                            </div>
                            <div className={styles.heatmapSvgWrap}>
                                <svg width="100%" height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}
                                    preserveAspectRatio="xMinYMid meet" style={{ display: 'block' }}>
                                    {weeklyData.map((w, i) => (
                                        <rect
                                            key={i}
                                            x={i * STRIDE}
                                            y={0}
                                            width={SQ}
                                            height={SQ}
                                            rx={1}
                                            fill={getHeatColor(w.total, w.failed)}
                                            opacity={w.total === 0 ? 0.3 : 0.85}
                                        >
                                            <title>Week of {w.week}: {w.total} heartbeats ({w.successful} ok, {w.failed} failed)</title>
                                        </rect>
                                    ))}
                                </svg>
                            </div>
                        </div>

                        {/* Groups table */}
                        <div className={styles.tableSection}>
                            <div className={styles.tableHeader}>
                                <span className={styles.tableInfo}>{hbGroups.length} heartbeat groups (most recent first)</span>
                            </div>
                            <div className={styles.tableWrapper}>
                                <table className={styles.activityTable}>
                                    <thead>
                                        <tr>
                                            <th>Week</th>
                                            <th>Date</th>
                                            <th>Rituals</th>
                                            <th>Successful</th>
                                            <th>Failed</th>
                                            <th>Success Rate</th>
                                            <th>Participants</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {hbLoading ? (
                                            <SkeletonRows rows={8} cols={8} />
                                        ) : hbGroups.length === 0 ? (
                                            <tr><td colSpan={8} className={styles.tableEmpty}>No heartbeat groups found</td></tr>
                                        ) : hbGroups.map((group, idx) => (
                                            <tr key={idx} className={styles.clickableRow}
                                                onClick={() => navigate(`/heartbeat-group/${new Date(group.mondayMidnight).toISOString().split('T')[0]}`)}>
                                                <td>
                                                    <span className={styles.eventType} style={{ color: "#10B981", borderColor: "#10B981" }}>
                                                        Week {group.weekNumber}
                                                    </span>
                                                </td>
                                                <td className={styles.dimCell}>{formatWeekDate(group.mondayMidnight)}</td>
                                                <td style={{ fontWeight: 600 }}>{group.stats.total}</td>
                                                <td>
                                                    <span style={{ color: "#10B981", fontWeight: 600 }}>{group.stats.successful}</span>
                                                </td>
                                                <td>
                                                    <span style={{ color: group.stats.failed > 0 ? "#EF4444" : "#6B7280", fontWeight: 600 }}>
                                                        {group.stats.failed}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        color: parseFloat(group.stats.successRate) >= 90 ? "#10B981" :
                                                               parseFloat(group.stats.successRate) >= 70 ? "#F59E0B" : "#EF4444",
                                                        fontWeight: 600,
                                                    }}>
                                                        {group.stats.successRate}%
                                                    </span>
                                                </td>
                                                <td>{group.uniqueParticipants?.length || 0}</td>
                                                <td>
                                                    <Link
                                                        to={`/heartbeat-group/${new Date(group.mondayMidnight).toISOString().split('T')[0]}`}
                                                        className={styles.ritualLink}
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        View →
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}

export default RitualPage;
