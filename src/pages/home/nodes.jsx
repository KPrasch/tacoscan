import React, { useState, useEffect } from "react";
import * as Data from "../data";
import NodesTable from "../../components/table/nodes";
import { StatsCard } from "../../components/ui";
import styles from "./styles.module.css";

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

  useEffect(() => {
    setPageData((prevState) => ({
      ...prevState,
      rowData: [],
      isLoading: true,
    }));

    Data.getNodes(isSearch, searchInput).then((info) => {
      const {nodes, statsRecord} = Data.formatNodes(info?.appAuthorizations || []);
      const totalNodes = nodes.length;

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
        />
        <StatsCard 
          title="Confirmed Operators"
          value={stats?.numBondedOperators || 0}
          loading={pageData.isLoading}
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
        />
      </div>
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
