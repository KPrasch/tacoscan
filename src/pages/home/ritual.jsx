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
        ritualCounter: {}
    });
    const [showHeartbeats, setShowHeartbeats] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');

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
                
                // Filter out heartbeats if not showing them
                if (!showHeartbeats) {
                    filteredData = filteredData.filter(ritual => !ritual.isHeartbeat);
                }
                
                // Apply status filter
                if (statusFilter !== 'all') {
                    switch (statusFilter) {
                        case 'successful':
                            filteredData = filteredData.filter(r => r.status === 'SUCCESSFUL' || r.status === 'ACTIVE');
                            break;
                        case 'timeout':
                            filteredData = filteredData.filter(r => r.status === 'TIME OUT' || r.status === 'EXPIRED');
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
                
                // Calculate counts for display (respecting heartbeat filter)
                const dataForCounts = showHeartbeats ? formattedData : formattedData.filter(r => !r.isHeartbeat);
                
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
                
                setPageData({
                    isLoading: false,
                    rowData: filteredData,
                    ritualCounter: {
                        total: totalCount,
                        successful: successfulCount,
                        pending: pendingCount,
                        failed: failedCount
                    }
                });
            }

        });

    }, [network, isSearch, showHeartbeats, statusFilter]);


    return (
        <div style={{ background: "#F9FAFB", minHeight: "100vh", paddingBottom: "60px" }}>
            <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px 20px" }}>
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
                {/* Status Filter Buttons */}
                <div style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap"
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
                        onClick={() => setStatusFilter('timeout')}
                        style={{
                            padding: "8px 16px",
                            background: statusFilter === 'timeout' ? "#059669" : "#FFFFFF",
                            color: statusFilter === 'timeout' ? "#FFFFFF" : "#6B7280",
                            border: "1px solid #E5E7EB",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: 500,
                            fontFamily: "var(--font-mono)",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                        }}
                    >
                        Timed Out ({pageData.ritualCounter?.failed || 0})
                    </button>
                </div>

                {/* Heartbeat Toggle */}
                <button
                    onClick={() => setShowHeartbeats(!showHeartbeats)}
                    style={{
                        padding: "8px 16px",
                        background: showHeartbeats ? "#059669" : "#FFFFFF",
                        color: showHeartbeats ? "#FFFFFF" : "#6B7280",
                        border: "1px solid #E5E7EB",
                        borderRadius: "6px",
                        fontSize: "14px",
                        fontWeight: 500,
                        fontFamily: "var(--font-mono)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                    }}
                >
                    {showHeartbeats ? "Hide" : "Show"} Heartbeats
                </button>
            </div>

            <div className={styles.table_content} style={{ marginTop: "0" }}>
                <RitualTable
                    columns={Data.ritual_columns}
                    data={pageData.rowData}
                    isLoading={pageData.isLoading}
                    network={network}
                />
            </div>
            </div>
        </div>
    );
}

export default RitualPage;