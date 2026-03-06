import React, {useState, useEffect, useMemo} from "react";
import { useNavigate } from 'react-router-dom';
import * as Data from "../data";
import styles from './styles.module.css'
import PageHeader from '../../components/PageHeader'
import { SkeletonRows } from '../../components/Skeleton'

const RitualPage = ({network = 'polygon', isSearch = false, searchInput = ''} = {}) => {
    const [pageData, setPageData] = useState({
        rowData: [],
        isLoading: false,
        pageNumber: 1,
        ritualCounter: {},
        heartbeatGroups: []
    });
    const [statusFilter, setStatusFilter] = useState('successful'); // Default to successful
    const [ritualTypeFilter, setRitualTypeFilter] = useState('regular'); // all, regular, heartbeats, failed-heartbeats
    const [viewMode, setViewMode] = useState('list'); // list or groups (for heartbeats)
    const navigate = useNavigate();
    const [sortBy, setSortBy] = useState('id');
    const [sortOrder, setSortOrder] = useState('desc');

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
    }, [pageData.rowData, sortBy, sortOrder]);

    useEffect(() => {
        setPageData((prevState) => ({
            ...prevState,
            rowData: [],
            ritualCounter: {},
            isLoading: true,
        }));

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

                // Apply filters
                let filteredData = formattedData;

                // Apply ritual type filter first
                switch (ritualTypeFilter) {
                    case 'regular':
                        // Show only non-heartbeat rituals
                        filteredData = filteredData.filter(ritual => !ritual.isHeartbeat);
                        break;
                    case 'heartbeats':
                        // Show only heartbeats
                        filteredData = filteredData.filter(ritual => ritual.isHeartbeat);
                        break;
                    case 'failed-heartbeats':
                        // Show only failed heartbeats
                        filteredData = filteredData.filter(ritual =>
                            ritual.isHeartbeat && (
                                ritual.status === 'TIME OUT' ||
                                ritual.status === 'EXPIRED' ||
                                ritual.status === 'DKG INVALID' ||
                                ritual.status === 'DKG ERROR' ||
                                ritual.status === 'TIMEOUT'
                            )
                        );
                        break;
                    // 'all' shows everything, no filter needed
                }

                // Apply status filter (works on already filtered data)
                if (statusFilter !== 'all') {
                    switch (statusFilter) {
                        case 'successful':
                            filteredData = filteredData.filter(r => r.status === 'SUCCESSFUL' || r.status === 'ACTIVE');
                            break;
                        case 'pending':
                            filteredData = filteredData.filter(r =>
                                r.status === 'DKG AWAITING TRANSCRIPTS' ||
                                r.status === 'DKG AWAITING AGGREGATIONS'
                            );
                            break;
                        case 'failed':
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

                // Calculate counts for display based on ritual type filter
                const dataForCounts = ritualTypeFilter === 'regular'
                    ? formattedData.filter(r => !r.isHeartbeat)
                    : ritualTypeFilter === 'heartbeats'
                    ? formattedData.filter(r => r.isHeartbeat)
                    : ritualTypeFilter === 'failed-heartbeats'
                    ? formattedData.filter(r => r.isHeartbeat && (
                        r.status === 'TIME OUT' ||
                        r.status === 'EXPIRED' ||
                        r.status === 'DKG INVALID' ||
                        r.status === 'DKG ERROR' ||
                        r.status === 'TIMEOUT'
                    ))
                    : formattedData;

                const successfulCount = dataForCounts.filter(r =>
                    r.status === 'SUCCESSFUL' || r.status === 'ACTIVE'
                ).length;

                const pendingCount = dataForCounts.filter(r =>
                    r.status === 'DKG AWAITING TRANSCRIPTS' ||
                    r.status === 'DKG AWAITING AGGREGATIONS'
                ).length;

                const failedCount = dataForCounts.filter(r =>
                    r.status === 'TIME OUT' ||
                    r.status === 'EXPIRED' ||
                    r.status === 'DKG INVALID' ||
                    r.status === 'DKG ERROR' ||
                    r.status === 'TIMEOUT'
                ).length;

                const totalCount = dataForCounts.length;

                // Detect heartbeat groups if viewing heartbeats
                const heartbeatGroups = (ritualTypeFilter === 'heartbeats' || ritualTypeFilter === 'failed-heartbeats')
                    ? Data.detectHeartbeatGroups(formattedData, timeout)
                    : [];

                setPageData({
                    isLoading: false,
                    rowData: filteredData,
                    ritualCounter: {
                        total: totalCount,
                        successful: successfulCount,
                        pending: pendingCount,
                        failed: failedCount
                    },
                    heartbeatGroups: heartbeatGroups
                });
            }

        }).catch((err) => {
            console.error('Failed to load rituals:', err);
            setPageData({ isLoading: false, rowData: [], ritualCounter: {}, heartbeatGroups: [] });
        });

    }, [network, isSearch, statusFilter, ritualTypeFilter]);

    // Component to display heartbeat groups
    const HeartbeatGroupsView = ({ groups }) => {
        return (
            <div style={{
                display: 'grid',
                gap: '10px',
                marginBottom: '16px'
            }}>
                {groups.map((group, idx) => (
                    <div key={idx} style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '14px 16px',
                        boxShadow: 'var(--shadow-sm)',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'box-shadow 0.15s ease, transform 0.15s ease'
                    }}
                    onClick={() => {
                        const mondayDate = new Date(group.mondayMidnight).toISOString().split('T')[0];
                        window.location.href = `/heartbeat-group/${mondayDate}`;
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}>
                        {/* Card header row */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '12px'
                        }}>
                            <div>
                                <div style={{
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    fontFamily: 'var(--font-display)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    Monday, {new Date(group.mondayMidnight).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric',
                                        timeZone: 'UTC'
                                    })}
                                    <span style={{
                                        fontSize: '11px',
                                        color: 'var(--text-tertiary)',
                                        fontFamily: 'var(--font-mono)'
                                    }}>
                                        →
                                    </span>
                                </div>
                                <div style={{
                                    marginTop: '2px',
                                    fontSize: '11px',
                                    color: 'var(--text-tertiary)',
                                    fontFamily: 'var(--font-mono)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.4px'
                                }}>
                                    {group.weekNumber === 0 ? 'THIS WEEK' :
                                     group.weekNumber === 1 ? 'LAST WEEK' :
                                     `${group.weekNumber} WEEKS AGO`}
                                    <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
                                    {group.rituals.length} RITUALS
                                </div>
                            </div>

                            {/* Warning badge if group has unusually few rituals */}
                            {group.rituals.length < 10 && (
                                <div
                                    title={`Only ${group.rituals.length} ritual${group.rituals.length !== 1 ? 's' : ''} (expected 10+)`}
                                    style={{
                                        width: '18px',
                                        height: '18px',
                                        background: '#FBBF24',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        color: '#FFFFFF',
                                        cursor: 'help',
                                        flexShrink: 0
                                    }}>
                                    !
                                </div>
                            )}
                        </div>

                        {/* Compact stat row — mirrors overviewStats pattern */}
                        <div style={{
                            display: 'flex',
                            gap: '0',
                            borderTop: '1px solid var(--border-light)',
                            paddingTop: '10px'
                        }}>
                            {[
                                { label: 'TOTAL', value: group.stats.total, color: 'var(--text-primary)' },
                                { label: 'SUCCESSFUL', value: group.stats.successful, color: 'var(--status-active)' },
                                { label: 'FAILED', value: group.stats.failed, color: '#EF4444' },
                                { label: 'SUCCESS RATE', value: `${group.stats.successRate}%`, color: 'var(--text-primary)' },
                            ].map((stat, i, arr) => (
                                <div key={stat.label} style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '3px',
                                    paddingRight: i < arr.length - 1 ? '16px' : 0,
                                    marginRight: i < arr.length - 1 ? '16px' : 0,
                                    borderRight: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none'
                                }}>
                                    <span style={{
                                        fontSize: '10px',
                                        fontWeight: 600,
                                        color: 'var(--text-secondary)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        fontFamily: 'var(--font-mono)'
                                    }}>
                                        {stat.label}
                                    </span>
                                    <span style={{
                                        fontSize: '18px',
                                        fontWeight: 700,
                                        color: stat.color,
                                        fontFamily: 'var(--font-mono)'
                                    }}>
                                        {stat.value}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Expandable ritual list */}
                        <details style={{ marginTop: '12px' }}>
                            <summary style={{
                                cursor: 'pointer',
                                fontSize: '11px',
                                color: 'var(--text-tertiary)',
                                fontWeight: 600,
                                fontFamily: 'var(--font-mono)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.4px',
                                userSelect: 'none',
                                listStyle: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                <span>View {group.rituals.length} Rituals</span>
                                <span style={{ opacity: 0.5 }}>
                                    (#{group.rituals[0]?.id} – #{group.rituals[group.rituals.length - 1]?.id})
                                </span>
                            </summary>
                            <div style={{
                                marginTop: '10px',
                                paddingTop: '10px',
                                borderTop: '1px solid var(--border-light)'
                            }}>
                                {/* Execution window */}
                                <div style={{
                                    marginBottom: '8px',
                                    padding: '6px 10px',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-light)',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    color: 'var(--text-secondary)',
                                    fontFamily: 'var(--font-mono)'
                                }}>
                                    <strong style={{ color: 'var(--text-primary)' }}>Execution Window:</strong>
                                    {' '}
                                    {new Date(group.rituals[0]?.initTimeStamp).toLocaleString('en-US', {
                                        timeZone: 'UTC',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        timeZoneName: 'short'
                                    })} – {new Date(group.rituals[group.rituals.length - 1]?.initTimeStamp).toLocaleString('en-US', {
                                        timeZone: 'UTC',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        timeZoneName: 'short'
                                    })}
                                </div>

                                {group.rituals.map(ritual => (
                                    <div key={ritual.id} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '6px 0',
                                        borderBottom: '1px solid var(--border-light)'
                                    }}>
                                        <a
                                            href={`/ritual/${ritual.id}`}
                                            onClick={(e) => e.stopPropagation()}
                                            style={{
                                                color: 'var(--status-data)',
                                                textDecoration: 'none',
                                                fontSize: '12px',
                                                fontFamily: 'var(--font-mono)'
                                            }}
                                        >
                                            #{ritual.id}
                                        </a>
                                        <span style={{
                                            fontSize: '11px',
                                            fontFamily: 'var(--font-mono)',
                                            fontWeight: 600,
                                            padding: '2px 7px',
                                            borderRadius: '3px',
                                            background: ritual.status === 'SUCCESSFUL' || ritual.status === 'ACTIVE'
                                                ? 'rgba(74, 222, 128, 0.12)'
                                                : ritual.status.includes('TIME OUT') || ritual.status === 'EXPIRED'
                                                ? 'rgba(239, 68, 68, 0.1)'
                                                : 'var(--bg-tertiary)',
                                            color: ritual.status === 'SUCCESSFUL' || ritual.status === 'ACTIVE'
                                                ? 'var(--status-active)'
                                                : ritual.status.includes('TIME OUT') || ritual.status === 'EXPIRED'
                                                ? '#EF4444'
                                                : 'var(--text-secondary)'
                                        }}>
                                            {ritual.status}
                                        </span>
                                        <span style={{
                                            fontSize: '11px',
                                            color: 'var(--text-tertiary)',
                                            fontFamily: 'var(--font-mono)'
                                        }}>
                                            {ritual.totalParticipants} participants
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </details>
                    </div>
                ))}
            </div>
        );
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
                    title={isSearch ? `Search: ${searchInput}` : 'DKG Rituals'}
                    subtitle={isSearch ? undefined : 'Distributed key generation ceremonies for threshold decryption'}
                    stats={[
                        { label: 'Total',      value: pageData.isLoading ? '—' : (pageData.ritualCounter?.total      ?? 0) },
                        { label: 'Successful', value: pageData.isLoading ? '—' : (pageData.ritualCounter?.successful ?? 0) },
                        { label: 'Pending',    value: pageData.isLoading ? '—' : (pageData.ritualCounter?.pending    ?? 0) },
                        { label: 'Failed',     value: pageData.isLoading ? '—' : (pageData.ritualCounter?.failed     ?? 0) },
                    ]}
                />

                {/* Filters row */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                    flexWrap: 'wrap',
                    gap: '8px'
                }}>
                    {/* Left: status filter buttons */}
                    <div style={{
                        display: 'flex',
                        gap: '6px',
                        flexWrap: 'wrap',
                        alignItems: 'center'
                    }}>
                        <button
                            onClick={() => setStatusFilter('all')}
                            style={filterBtn(statusFilter === 'all')}
                        >
                            All ({pageData.ritualCounter?.total ?? 0})
                        </button>
                        <button
                            onClick={() => setStatusFilter('successful')}
                            style={filterBtn(statusFilter === 'successful')}
                        >
                            Successful ({pageData.ritualCounter?.successful ?? 0})
                        </button>
                        <button
                            onClick={() => setStatusFilter('pending')}
                            style={filterBtn(statusFilter === 'pending')}
                        >
                            Pending ({pageData.ritualCounter?.pending ?? 0})
                        </button>
                        <button
                            onClick={() => setStatusFilter('failed')}
                            style={filterBtn(statusFilter === 'failed')}
                        >
                            Failed ({pageData.ritualCounter?.failed ?? 0})
                        </button>
                    </div>

                    {/* Right: Show dropdown + view toggle */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        flexWrap: 'wrap'
                    }}>
                        {/* Show: label + select */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <span style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--text-secondary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.4px'
                            }}>
                                Show:
                            </span>
                            <select
                                value={ritualTypeFilter}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setRitualTypeFilter(value);
                                    // Reset to 'all' status when viewing failed heartbeats
                                    if (value === 'failed-heartbeats') {
                                        setStatusFilter('all');
                                    }
                                    // Auto-switch to group view for heartbeats
                                    if (value === 'heartbeats' || value === 'failed-heartbeats') {
                                        setViewMode('groups');
                                    } else {
                                        setViewMode('list');
                                    }
                                }}
                                style={{
                                    padding: '4px 28px 4px 8px',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    fontFamily: 'var(--font-mono)',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    minWidth: '180px',
                                    outline: 'none',
                                    appearance: 'none',
                                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235A5A5A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 6px center',
                                    backgroundSize: '14px',
                                    transition: 'border-color 0.15s ease'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = 'var(--accent-green)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'var(--border-color)';
                                }}
                            >
                                <option value="all">All Rituals</option>
                                <option value="regular">Regular Rituals Only</option>
                                <option value="heartbeats">Heartbeats Only</option>
                                <option value="failed-heartbeats">Failed Heartbeats</option>
                            </select>
                        </div>

                        {/* View mode toggle — only shown for heartbeat modes */}
                        {(ritualTypeFilter === 'heartbeats' || ritualTypeFilter === 'failed-heartbeats') && (
                            <div style={{
                                display: 'flex',
                                background: 'var(--bg-tertiary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                padding: '2px',
                                gap: '2px'
                            }}>
                                <button
                                    onClick={() => setViewMode('groups')}
                                    style={{
                                        padding: '3px 10px',
                                        background: viewMode === 'groups' ? 'var(--bg-surface)' : 'transparent',
                                        border: viewMode === 'groups' ? '1px solid var(--border-color)' : '1px solid transparent',
                                        borderRadius: '3px',
                                        fontSize: '11px',
                                        fontWeight: viewMode === 'groups' ? 600 : 500,
                                        fontFamily: 'var(--font-mono)',
                                        color: viewMode === 'groups' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    Weekly Groups
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    style={{
                                        padding: '3px 10px',
                                        background: viewMode === 'list' ? 'var(--bg-surface)' : 'transparent',
                                        border: viewMode === 'list' ? '1px solid var(--border-color)' : '1px solid transparent',
                                        borderRadius: '3px',
                                        fontSize: '11px',
                                        fontWeight: viewMode === 'list' ? 600 : 500,
                                        fontFamily: 'var(--font-mono)',
                                        color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    List View
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main content: heartbeat groups or table */}
                {viewMode === 'groups' && (ritualTypeFilter === 'heartbeats' || ritualTypeFilter === 'failed-heartbeats') ? (
                    <HeartbeatGroupsView groups={pageData.heartbeatGroups} />
                ) : (
                    <div className={styles.tableContainer}>
                        <table className={styles.ritualTable}>
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort('id')} className={styles.sortable}>#{ sortInd('id')}</th>
                                    <th onClick={() => handleSort('authority')} className={styles.sortable}>Authority{sortInd('authority')}</th>
                                    <th onClick={() => handleSort('participants')} className={styles.sortable}>Participants{sortInd('participants')}</th>
                                    <th>Threshold</th>
                                    <th onClick={() => handleSort('transcripts')} className={styles.sortable}>Transcripts{sortInd('transcripts')}</th>
                                    <th onClick={() => handleSort('aggregations')} className={styles.sortable}>Aggregations{sortInd('aggregations')}</th>
                                    <th onClick={() => handleSort('status')} className={styles.sortable}>Status{sortInd('status')}</th>
                                    <th onClick={() => handleSort('updateTime')} className={styles.sortable}>Updated{sortInd('updateTime')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageData.isLoading ? (
                                    <SkeletonRows rows={10} cols={8} />
                                ) : sortedData.length === 0 ? (
                                    <tr><td colSpan={8} className={styles.tableEmpty}>No rituals</td></tr>
                                ) : sortedData.map((ritual) => (
                                    <tr
                                        key={ritual.id}
                                        className={styles.clickableRow}
                                        onClick={() => navigate(`/rituals/${ritual.id}`)}
                                    >
                                        <td className={styles.ritualIdCell}>
                                            {ritual.id}
                                            {ritual.isHeartbeat && <span className={styles.hbBadge}>HB</span>}
                                        </td>
                                        <td className={styles.addrCell}>{Data.formatString(ritual.authority)}</td>
                                        <td className={styles.numCell}>{ritual.totalParticipants}</td>
                                        <td className={styles.dimCell}>
                                            {ritual.threshold ? `${ritual.threshold} of ${ritual.totalParticipants}` : `— of ${ritual.totalParticipants}`}
                                        </td>
                                        <td className={ritual.totalPostedTranscripts === ritual.totalParticipants ? styles.progressFull : styles.progressPartial}>
                                            {ritual.totalPostedTranscripts} / {ritual.totalParticipants}
                                        </td>
                                        <td className={ritual.totalPostedAggregations === ritual.totalParticipants ? styles.progressFull : styles.progressPartial}>
                                            {ritual.totalPostedAggregations} / {ritual.totalParticipants}
                                        </td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${statusClass(ritual.status)}`}>
                                                {STATUS_SHORT[ritual.status] || ritual.status}
                                            </span>
                                        </td>
                                        <td className={styles.dimCell}>{Data.calculateTimeMoment(ritual.updateTime)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            </div>
        </div>
    );
}

export default RitualPage;
