import React from "react";
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import Link from "@mui/material/Link";
import {ReactComponent as ShareLink} from "../../assets/link.svg";
import styles from "./styles.module.css";
import {getPolygonScanTxHashLink, getPolygonScanAddressLink} from "../../utils/utils"
import * as Data from "../../pages/data";
import {getColorByStatus} from "./view_utils"
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";

export default function TransactionTimeline({ transactions, network }) {
  // Reverse the transactions array to show oldest first (left to right)
  const sortedTransactions = [...transactions].reverse();
  const transactionLength = sortedTransactions.length;
  
  return (
    <Box className={styles.timelineContainer}>
      <Timeline 
        sx={{
          padding: 0,
          margin: 0,
          minHeight: '120px',
          [`& .MuiTimelineItem-root::before`]: {
            display: 'none'
          }
        }}
      >
        {sortedTransactions.map((transaction, index) => (
          <TimelineItem key={index} className={styles.timelineItem}>
            <TimelineSeparator>
              <Tooltip title={Data.formatDate(transaction.timestamp * 1000)}>
                <TimelineDot sx={{
                  backgroundColor: getColorByStatus(transaction.description),
                  width: '12px',
                  height: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 0 0 3px white',
                  padding: 0,
                  margin: 0
                }}/>
              </Tooltip>
              {index !== transactionLength - 1 && (
                <TimelineConnector />
              )}
            </TimelineSeparator>
            <TimelineContent>
              <div className={styles.timelineContentWrapper}>
                <div className={styles.timelineTime}>
                  {Data.calculateTimeMoment(transaction.timestamp * 1000)}
                </div>
                <div className={styles.timelineDescription}>
                  {transaction.txHash ? (
                    <Link
                      target="_blank"
                      underline="hover"
                      href={getPolygonScanTxHashLink() + transaction.txHash}
                      className={styles.link}
                    >
                      {transaction.description}
                      <ShareLink style={{ verticalAlign: 'middle' }}/>
                    </Link>
                  ) : (
                    <span className={styles.descriptionSpan}>
                      {transaction.description}
                    </span>
                  )}
                  {transaction.from && (
                    <>
                      <span className={styles.bySpan}>by</span>
                      <Link
                        target="_blank"
                        underline="hover"
                        href={getPolygonScanAddressLink() + transaction.from}
                        className={styles.by_link}
                      >
                        {Data.formatString(transaction.from)}
                        <ShareLink style={{ verticalAlign: 'middle' }}/>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </Box>
  );
}
