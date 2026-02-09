import React, {useState, useEffect} from "react";
import * as Data from "../data";
import RitualTable from "../../components/table/ritual";
import { StatsCard } from "../../components/ui";
import styles from './styles.module.css'

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
                const timeout = await Data.getTimeout();
                const formattedData = Data.formatRitualsData(info.rituals, timeout);
                
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

        });

    }, [network, isSearch, statusFilter, ritualTypeFilter]);

    // Component to display heartbeat groups
    const HeartbeatGroupsView = ({ groups }) => {
        return (
            <div style={{
                display: 'grid',
                gap: '16px',
                marginBottom: '32px'
            }}>
                {groups.map((group, idx) => (
                    <div key={idx} style={{
                        background: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        padding: '20px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                    onClick={() => {
                        const mondayDate = new Date(group.mondayMidnight).toISOString().split('T')[0];
                        window.location.href = `/heartbeat-group/${mondayDate}`;
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '16px'
                        }}>
                            <div>
                                <h3 style={{
                                    margin: 0,
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    color: '#111827',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    Monday, {new Date(group.mondayMidnight).toLocaleDateString('en-US', { 
                                        month: 'long', 
                                        day: 'numeric', 
                                        year: 'numeric',
                                        timeZone: 'UTC'
                                    })}
                                    <span style={{ fontSize: '12px', color: '#6B7280' }}>→</span>
                                </h3>
                                <p style={{
                                    margin: '4px 0 0 0',
                                    fontSize: '14px',
                                    color: '#6B7280'
                                }}>
                                    {group.weekNumber === 0 ? 'This Week' : 
                                     group.weekNumber === 1 ? 'Last Week' :
                                     `${group.weekNumber} Weeks Ago`} • {group.rituals.length} heartbeat rituals
                                </p>
                            </div>
                        </div>
                        
                        {/* Warning icon if group has unusually few rituals */}
                        {group.rituals.length < 10 && (
                            <div 
                                title={`Only ${group.rituals.length} ritual${group.rituals.length !== 1 ? 's' : ''} (expected 10+)`}
                                style={{
                                    position: 'absolute',
                                    top: '20px',
                                    right: '60px',
                                    width: '20px',
                                    height: '20px',
                                    background: '#FBBF24',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    color: '#FFFFFF',
                                    cursor: 'help',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                }}>
                                ⚠
                            </div>
                        )}
                        
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                            gap: '12px',
                            marginBottom: '16px'
                        }}>
                            <div>
                                <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '2px' }}>Total</div>
                                <div style={{ fontSize: '20px', fontWeight: 600, color: '#111827' }}>{group.stats.total}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '2px' }}>Successful</div>
                                <div style={{ fontSize: '20px', fontWeight: 600, color: '#059669' }}>{group.stats.successful}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '2px' }}>Failed</div>
                                <div style={{ fontSize: '20px', fontWeight: 600, color: '#DC2626' }}>{group.stats.failed}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '2px' }}>Success Rate</div>
                                <div style={{ fontSize: '20px', fontWeight: 600, color: '#111827' }}>{group.stats.successRate}%</div>
                            </div>
                        </div>
                        
                        <details style={{ marginTop: '12px' }}>
                            <summary style={{
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: '#4B5563',
                                fontWeight: 500,
                                userSelect: 'none'
                            }}>
                                View {group.rituals.length} Rituals (IDs: #{group.rituals[0]?.id} - #{group.rituals[group.rituals.length - 1]?.id})
                            </summary>
                            <div style={{
                                marginTop: '12px',
                                paddingTop: '12px',
                                borderTop: '1px solid #E5E7EB'
                            }}>
                                {/* Show time range of rituals */}
                                <div style={{
                                    marginBottom: '12px',
                                    padding: '8px',
                                    background: '#F9FAFB',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    color: '#6B7280'
                                }}>
                                    <strong>Execution Window:</strong> {new Date(group.rituals[0]?.initTimeStamp).toLocaleString('en-US', {
                                        timeZone: 'UTC',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        timeZoneName: 'short'
                                    })} - {new Date(group.rituals[group.rituals.length - 1]?.initTimeStamp).toLocaleString('en-US', {
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
                                        padding: '8px 0',
                                        borderBottom: '1px solid #F3F4F6'
                                    }}>
                                        <a
                                            href={`/ritual/${ritual.id}`}
                                            style={{
                                                color: '#3B82F6',
                                                textDecoration: 'none',
                                                fontSize: '14px',
                                                fontFamily: 'var(--font-mono)'
                                            }}
                                        >
                                            #{ritual.id}
                                        </a>
                                        <span style={{
                                            fontSize: '13px',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            background: ritual.status === 'SUCCESSFUL' || ritual.status === 'ACTIVE' ? '#D1FAE5' :
                                                       ritual.status.includes('TIME OUT') || ritual.status === 'EXPIRED' ? '#FEE2E2' :
                                                       '#F3F4F6',
                                            color: ritual.status === 'SUCCESSFUL' || ritual.status === 'ACTIVE' ? '#065F46' :
                                                   ritual.status.includes('TIME OUT') || ritual.status === 'EXPIRED' ? '#991B1B' :
                                                   '#4B5563'
                                        }}>
                                            {ritual.status}
                                        </span>
                                        <span style={{
                                            fontSize: '13px',
                                            color: '#6B7280'
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

    return (
        <div style={{ background: "#F9FAFB", minHeight: "100vh", paddingBottom: "60px" }}>
            <div style={{ maxWidth: "1600px", margin: "0 auto", padding: "24px 20px" }}>
                {isSearch ? (
                    <h3 style={{ margin: 0, color: "#0A0A0A" }}>Search Results: {searchInput}</h3>
                ) : (
                    <h1 style={{ 
                        margin: 0, 
                        fontSize: "2.5rem", 
                        fontWeight: 700, 
                        color: "#0A0A0A",
                        marginBottom: "24px"
                    }}>
                        DKG Rituals
                    </h1>
                )}
            
            {/* Stats Cards */}
            <div style={{
                display: "flex",
                gap: "16px",
                flexWrap: "wrap",
                marginBottom: "32px"
            }}>
                <StatsCard 
                    title="Total Rituals"
                    value={pageData.ritualCounter?.total || 0}
                    loading={pageData.isLoading}
                />
                <StatsCard 
                    title="Successful"
                    value={pageData.ritualCounter?.successful || 0}
                    loading={pageData.isLoading}
                />
                <StatsCard 
                    title="Pending"
                    value={pageData.ritualCounter?.pending || 0}
                    loading={pageData.isLoading}
                />
                <StatsCard 
                    title="Failed"
                    value={pageData.ritualCounter?.failed || 0}
                    loading={pageData.isLoading}
                />
            </div>

            {/* Filters Section */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
                flexWrap: "wrap",
                gap: "16px"
            }}>
                {/* Left side: Status filters */}
                <div style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    alignItems: "center"
                }}>
                    <button
                        onClick={() => setStatusFilter('all')}
                        style={{
                            padding: "8px 16px",
                            background: statusFilter === 'all' ? "#059669" : "#FFFFFF",
                            color: statusFilter === 'all' ? "#FFFFFF" : "#6B7280",
                            border: "1px solid #E5E7EB",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: 500,
                            fontFamily: "var(--font-mono)",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                        }}
                    >
                        All ({pageData.ritualCounter?.total || 0})
                    </button>
                    <button
                        onClick={() => setStatusFilter('successful')}
                        style={{
                            padding: "8px 16px",
                            background: statusFilter === 'successful' ? "#059669" : "#FFFFFF",
                            color: statusFilter === 'successful' ? "#FFFFFF" : "#6B7280",
                            border: "1px solid #E5E7EB",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: 500,
                            fontFamily: "var(--font-mono)",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                        }}
                    >
                        Successful ({pageData.ritualCounter?.successful || 0})
                    </button>
                    <button
                        onClick={() => setStatusFilter('pending')}
                        style={{
                            padding: "8px 16px",
                            background: statusFilter === 'pending' ? "#059669" : "#FFFFFF",
                            color: statusFilter === 'pending' ? "#FFFFFF" : "#6B7280",
                            border: "1px solid #E5E7EB",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: 500,
                            fontFamily: "var(--font-mono)",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                        }}
                    >
                        Pending ({pageData.ritualCounter?.pending || 0})
                    </button>
                    <button
                        onClick={() => setStatusFilter('failed')}
                        style={{
                            padding: "8px 16px",
                            background: statusFilter === 'failed' ? "#059669" : "#FFFFFF",
                            color: statusFilter === 'failed' ? "#FFFFFF" : "#6B7280",
                            border: "1px solid #E5E7EB",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: 500,
                            fontFamily: "var(--font-mono)",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                        }}
                    >
                        Failed ({pageData.ritualCounter?.failed || 0})
                    </button>
                </div>

                {/* Right side: Ritual type dropdown and view toggle */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px"
                }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px"
                    }}>
                        <label style={{
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "#374151"
                        }}>
                            Show:
                        </label>
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
                                padding: "8px 12px 8px 12px",
                                paddingRight: "32px",
                                background: "#FFFFFF",
                                border: "1px solid #D1D5DB",
                                borderRadius: "8px",
                                fontSize: "14px",
                                fontWeight: 400,
                                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
                                color: "#111827",
                                cursor: "pointer",
                                minWidth: "220px",
                                outline: "none",
                                appearance: "none",
                                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                                backgroundRepeat: "no-repeat",
                                backgroundPosition: "right 8px center",
                                backgroundSize: "20px",
                                transition: "all 0.2s ease"
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = "#9CA3AF";
                                e.target.style.boxShadow = "0 0 0 3px rgba(156, 163, 175, 0.1)";
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = "#D1D5DB";
                                e.target.style.boxShadow = "none";
                            }}
                        >
                            <option value="all">All Rituals</option>
                            <option value="regular">Regular Rituals Only</option>
                            <option value="heartbeats">Heartbeats Only</option>
                            <option value="failed-heartbeats">Failed Heartbeats</option>
                        </select>
                    </div>
                    
                    {/* View mode toggle for heartbeats */}
                    {(ritualTypeFilter === 'heartbeats' || ritualTypeFilter === 'failed-heartbeats') && (
                        <div style={{
                            display: "flex",
                            background: "#F3F4F6",
                            borderRadius: "6px",
                            padding: "2px"
                        }}>
                            <button
                                onClick={() => setViewMode('groups')}
                                style={{
                                    padding: "6px 12px",
                                    background: viewMode === 'groups' ? "#FFFFFF" : "transparent",
                                    border: "none",
                                    borderRadius: "4px",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    color: viewMode === 'groups' ? "#111827" : "#6B7280",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease"
                                }}
                            >
                                Weekly Groups
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                style={{
                                    padding: "6px 12px",
                                    background: viewMode === 'list' ? "#FFFFFF" : "transparent",
                                    border: "none",
                                    borderRadius: "4px",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    color: viewMode === 'list' ? "#111827" : "#6B7280",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease"
                                }}
                            >
                                List View
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Show heartbeat groups or regular table based on view mode */}
            {viewMode === 'groups' && (ritualTypeFilter === 'heartbeats' || ritualTypeFilter === 'failed-heartbeats') ? (
                <HeartbeatGroupsView groups={pageData.heartbeatGroups} />
            ) : (
                <div className={styles.table_content} style={{ marginTop: "0" }}>
                    <RitualTable
                        columns={Data.ritual_columns}
                        data={pageData.rowData}
                        isLoading={pageData.isLoading}
                        network={network}
                    />
                </div>
            )}
            </div>
        </div>
    );
}

export default RitualPage;