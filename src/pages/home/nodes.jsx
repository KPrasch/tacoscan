import React, { useState, useEffect } from "react";
import * as Data from "../data";
import NodesTable from "../../components/table/nodes";
import { StatsCard } from "../../components/ui";
import styles from "./styles.module.css";
import { 
  categorizeAllNodes, 
  NodeStatus, 
  NodeStatusLabels, 
  NodeStatusIcons,
  NodeStatusColors,
  filterNodesByStatus 
} from "../../utils/nodeCategories";

const NodesPage = ({ network = 'polygon', isSearch = false, searchInput = '' } = {}) => {
  const [pageData, setPageData] = useState({
    rowData: [],
    isLoading: false,
    pageNumber: 1
  });

  const [stats, setStats] = useState({
    numBondedOperators: "loading...",
    totalAuthorizedAmount: 0,
    totalStaked: 0,
  });
  
  const [nodeCategories, setNodeCategories] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [rawData, setRawData] = useState([]);

  useEffect(() => {
    setPageData((prevState) => ({
      ...prevState,
      rowData: [],
      isLoading: true,
    }));

    Data.getNodes(isSearch, searchInput).then(async (info) => {
      const {nodes, statsRecord} = await Data.formatNodes(info?.appAuthorizations || []);
      const totalNodes = nodes.length;
      
      // Store raw data for filtering
      setRawData(info?.appAuthorizations || []);
      
      // Categorize nodes
      if (!isSearch && info?.appAuthorizations) {
        const categories = categorizeAllNodes(info.appAuthorizations);
        setNodeCategories(categories);
      }

      setPageData({
        isLoading: false,
        rowData: nodes,
        totalNodes: totalNodes,
      });

      if (!isSearch) {
        setStats(statsRecord);
      }
    }).catch((error) => {
      console.error("Error loading nodes:", error);
      setPageData({
        isLoading: false,
        rowData: [],
        totalNodes: 0,
      });
      setStats({
        numBondedOperators: 0,
        totalAuthorizedAmount: 0,
        totalStaked: 0,
      });
    });
  }, [isSearch]);
  
  // Filter nodes when filter changes
  useEffect(() => {
    if (!rawData.length) return;
    
    const updateFilteredNodes = async () => {
      if (selectedFilter === 'all') {
        const {nodes} = await Data.formatNodes(rawData);
        setPageData(prev => ({
          ...prev,
          rowData: nodes,
          totalNodes: nodes.length
        }));
      } else {
        const filteredAuths = filterNodesByStatus(rawData, selectedFilter);
        const {nodes} = await Data.formatNodes(filteredAuths);
        
        setPageData(prev => ({
          ...prev,
          rowData: nodes,
          totalNodes: nodes.length
        }));
      }
    };
    
    updateFilteredNodes();
  }, [selectedFilter, rawData]);

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
            Nodes
          </h1>
        )}
      
      <div style={{
        display: "flex",
        gap: "16px",
        flexWrap: "wrap"
      }}>
        <StatsCard 
          title="Total Nodes"
          value={pageData.totalNodes || 0}
          subtitle="nodes"
          loading={pageData.isLoading}
          tooltip="Total count of all staking providers in the network"
        />
        <StatsCard 
          title="Confirmed Operators"
          value={stats?.numBondedOperators || 0}
          loading={pageData.isLoading}
          tooltip="Count of nodes with confirmed operators (Active Confirmed status)"
        />
        <StatsCard 
          title="Total Authorized"
          value={
            <>
              {Data.formatWeiDecimalNoSurplus(stats?.totalAuthorizedAmount || 0)}
              <span style={{ fontSize: "1rem", marginLeft: "4px", color: "#6B7280" }}>T</span>
            </>
          }
          loading={pageData.isLoading}
          tooltip="Sum of all authorized stake amounts across all nodes with amount > 0"
        />
        <StatsCard 
          title="Total Staked"
          value={
            <>
              {Data.formatWeiDecimalNoSurplus(stats?.totalStaked || 0)}
              <span style={{ fontSize: "1rem", marginLeft: "4px", color: "#6B7280" }}>T</span>
            </>
          }
          loading={pageData.isLoading}
          tooltip="Sum of all staked T tokens across all staking providers"
        />
      </div>
      
      {/* Node Breakdown Section */}
      {!isSearch && nodeCategories && (
        <div style={{
          marginTop: "32px",
          marginBottom: "24px"
        }}>
          <h2 style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            color: "#0A0A0A",
            marginBottom: "16px"
          }}>
            Node Status Breakdown
          </h2>
          
          {/* Status Cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px"
          }}>
            {/* All Nodes Card */}
            <div
              onClick={() => setSelectedFilter('all')}
              title="Total count of all staking providers in the network"
              style={{
                background: selectedFilter === 'all' ? "rgba(150, 255, 94, 0.15)" : "#FFFFFF",
                border: selectedFilter === 'all' ? "2px solid #96FF5E" : "1px solid #E5E7EB",
                borderRadius: "8px",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                transition: "all 0.2s ease",
                minWidth: "200px",
                position: "relative",
                overflow: "hidden",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.08)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                background: "#96FF5E"
              }} />
              
              <div style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "#6B7280",
                marginBottom: "8px"
              }}>
                All Nodes
              </div>
              
              <div style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "#0A0A0A",
                lineHeight: 1.2,
                fontFamily: "var(--font-mono, 'Space Mono', monospace)"
              }}>
                {nodeCategories.totals.total}
              </div>
              
              <div style={{
                fontSize: "0.875rem",
                color: "#6B7280",
                marginTop: "4px"
              }}>
                Total in network
              </div>
            </div>
            
            {Object.values(NodeStatus).map(status => {
              // Define tooltips for each status
              const tooltips = {
                [NodeStatus.ACTIVE_CONFIRMED]: "Nodes with authorized stake amount > 0, have an operator address set, and operator is confirmed",
                [NodeStatus.PENDING_CONFIRMATION]: "Nodes with authorized stake amount > 0, have an operator address set, but operator is not yet confirmed",
                [NodeStatus.AUTHORIZED_NO_OPERATOR]: "Nodes with authorized stake amount > 0, but no operator address has been set",
                [NodeStatus.DEAUTHORIZED_WITH_OPERATOR]: "Nodes with no authorized stake (amount = 0 or deauthorized), but still have an operator address",
                [NodeStatus.DEAUTHORIZED_NO_OPERATOR]: "Nodes with no authorized stake and no operator address (never started or fully deauthorized)"
              };
              
              return (
              <div
                key={status}
                onClick={() => setSelectedFilter(status)}
                title={tooltips[status]}
                style={{
                  background: selectedFilter === status ? `${NodeStatusColors[status]}15` : "#FFFFFF",
                  border: selectedFilter === status ? `2px solid ${NodeStatusColors[status]}` : "1px solid #E5E7EB",
                  borderRadius: "8px",
                  padding: "24px",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                  transition: "all 0.2s ease",
                  minWidth: "200px",
                  position: "relative",
                  overflow: "hidden",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.08)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  background: NodeStatusColors[status]
                }} />
                
                <div style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "#6B7280",
                  marginBottom: "8px"
                }}>
                  {NodeStatusLabels[status]}
                </div>
                
                <div style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "#0A0A0A",
                  lineHeight: 1.2,
                  fontFamily: "var(--font-mono, 'Space Mono', monospace)"
                }}>
                  {nodeCategories.counts[status]}
                </div>
                
                <div style={{
                  fontSize: "0.875rem",
                  color: "#6B7280",
                  marginTop: "4px"
                }}>
                  {((nodeCategories.counts[status] / nodeCategories.totals.total) * 100).toFixed(1)}% of total
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}
      
      <div className={styles.table_content} style={{ marginTop: "24px" }}>
        <NodesTable
          columns={Data.node_columns}
          data={pageData.rowData}
          isLoading={pageData.isLoading}
          network={network}
        />
      </div>
    </div>
    </div>
  );
};

export default NodesPage;
