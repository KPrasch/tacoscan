import React, { useState, useEffect } from "react";
import * as Data from "../data";
import NodesTable from "../../components/table/nodes";
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
      <div className={styles.node_detail_header}>
        <div className={styles.node_detail_header_address}>
          {isSearch ? (
            <>
              <h4>Search : {searchInput}</h4>
              <span>{pageData.totalNodes} node</span>
            </>
          ) : (
            <>
              <h3>Nodes</h3>
              <span>{pageData.totalNodes} nodes</span>
            </>
          )}
        </div>
        <div className={styles.node_detail_header_value}>
          <div className={styles.node_detail_header_value_item}>
            <div className={styles.node_detail_header_value_item_lable}>
              Confirmed Operators
            </div>
            <div>
              <div>{stats?.numBondedOperators}</div>
            </div>
          </div>
        </div>
        <div className={styles.node_detail_header_value}>
          <div className={styles.node_detail_header_value_item}>
            <div className={styles.node_detail_header_value_item_lable_sub}>
              Total Authorized
            </div>
            <div>
              <div>
                {Data.formatWeiDecimalNoSurplus(
                  stats?.totalAuthorizedAmount
                )}
                <span className={styles.span_t_token}>{" T"}</span>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.node_detail_header_value}>
          <div className={styles.node_detail_header_value_item}>
            <div className={styles.node_detail_header_value_item_lable_sub}>
              Total Staked
            </div>
            <div>
              <div>
                {Data.formatWeiDecimalNoSurplus(
                  stats?.totalStaked
                )}
                <span className={styles.span_t_token}>{" T"}</span>
              </div>
            </div>
          </div>
        </div>
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
