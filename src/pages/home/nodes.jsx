import React, { useState, useEffect } from "react";
import * as Data from "../data";
import NodesTable from "../../components/table/nodes";
import { StatsCard } from "../../components/ui";
import styles from "./styles.module.css";

const NodesPage = ({ network, isSearch, searchInput }) => {
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
    <div>
      <div style={{ padding: "24px 40px" }}>
        {isSearch ? (
          <h3 style={{ margin: 0, color: "#0A0A0A" }}>Search Results: {searchInput}</h3>
        ) : (
          <h1 style={{ 
            margin: 0, 
            fontSize: "2.5rem", 
            fontWeight: 700, 
            color: "#0A0A0A",
            marginBottom: "8px"
          }}>
            Nodes
          </h1>
        )}
      </div>
      
      <div style={{ 
        padding: "0 40px 24px 40px",
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
      <div className={styles.table_content}>
        <NodesTable
          columns={Data.node_columns}
          data={pageData.rowData}
          isLoading={pageData.isLoading}
          network={network}
        />
      </div>
    </div>
  );
};

export default NodesPage;
