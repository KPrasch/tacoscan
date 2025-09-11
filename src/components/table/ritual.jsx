import React, { useMemo } from "react";
import { useTable } from "react-table";
import Loader from "../loader";
import styles from "./styles.module.css";
import CopyButton from "../CopyButton";
import PropTypes from "prop-types";
import {
  Tooltip,
  Button,
  ReportOutlinedIcon,
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Paper,
  KeyboardArrowDownIcon,
  KeyboardArrowUpIcon,
  Collapse,
  IconButton,
  Typography,
  Link
} from "../ui";
import { Link as RouterLink } from "react-router-dom";
import { ReactComponent as ShareLink } from "../../assets/link.svg";
import * as Data from "../../pages/data";
import * as Const from "../../utils/Cons";
import * as Utils from "../../utils/utils";
import {getColorByStatus} from "./view_utils"
import TransactionTimeline from "./timeline";

const formatAddresses = ({ addresses }) => {
  if (addresses.length === 0) return "-";
  
  return addresses.map((address, index) => (
    <div key={index}>
      <Link
        target="_blank"
        underline="hover"
        href={Utils.getPolygonScanAddressLink() + address}
        className={styles.link}
      >
        {address}
      </Link>
      <CopyButton
        onClick={(e) => copyToClipBoard(address)}
      />
    </div>
  ));
};

export const RitualTable = ({ columns, data, isLoading, network }) => {
  const columnData = useMemo(() => columns, [columns]);
  const rowData = useMemo(() => data, [data]);
  const { rows } = useTable({
    columns: columnData,
    data: rowData,
  });

  const copyToClipBoard = (data) => {
    try {
      navigator.clipboard.writeText(data);
    } catch (err) {}
  };

  function descendingComparator(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  }

  function getComparator(order, orderBy) {
    return order === "desc"
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  }

  // This method is created for cross-browser compatibility, if you don't
  // need to support IE11, you can use Array.prototype.sort() directly
  function stableSort(array, comparator) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) {
        return order;
      }
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  }

  function EnhancedTableHead(props) {
    const { order, orderBy, onRequestSort } = props;
    const createSortHandler = (property) => (event) => {
      onRequestSort(event, property);
    };

    return (
      <TableHead>
        <TableRow>
          <TableCell style={{ width: "50px", padding: "16px 8px" }} />
          {columns.map((headCell) => (
            <TableCell
              className={styles.th}
              key={headCell.accessor}
              align={"left"}
              sortDirection={orderBy === headCell.accessor ? order : false}
              style={{ 
                fontWeight: 600, 
                fontSize: "0.75rem",
                letterSpacing: "0.5px",
                color: "#666",
                padding: "16px 8px",
                whiteSpace: "nowrap"
              }}
            >
              {headCell.accessor == "id" ||
              headCell.accessor == "updateTime" ||
              headCell.accessor == "totalPostedAggregations" ||
              headCell.accessor == "totalPostedTranscripts" ||
              headCell.accessor == "totalParticipants" ||
              headCell.accessor == "status" ? (
                <TableSortLabel
                  direction={orderBy === headCell.accessor ? order : "desc"}
                  onClick={createSortHandler(headCell.accessor)}
                  style={{ fontWeight: 600 }}
                >
                  {headCell.header}
                </TableSortLabel>
              ) : (
                headCell.header
              )}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
    );
  }

  EnhancedTableHead.propTypes = {
    onRequestSort: PropTypes.func.isRequired,
    order: PropTypes.oneOf(["asc", "desc"]).isRequired,
    orderBy: PropTypes.string.isRequired,
    rowCount: PropTypes.number.isRequired,
  };

  const [order, setOrder] = React.useState("desc");
  const [orderBy, setOrderBy] = React.useState("updateTime");
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(100);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;


  function Row(props) {
    const { row } = props;
    const [open, setOpen] = React.useState(false);
    const [feeModel, setFeeModel] = React.useState(row.feeModel);
    
    // Fetch feeModel when row is expanded for the first time
    React.useEffect(() => {
      if (open && !feeModel) {
        Data.getRitualFeeModel(row.id).then(model => {
          if (model) {
            setFeeModel(model);
          }
        });
      }
    }, [open, row.id, feeModel]);
    
    return (
      <React.Fragment>
        <TableRow
          hover
          tabIndex={-1}
          key={row.name}
          className={open ? styles.rowSeleted : null}
          onClick={() => setOpen(!open)}
        >
          <TableCell className={styles.td_selected} style={{ width: "50px", padding: "8px" }}>
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => setOpen(!open)}
            >
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </TableCell>
          <TableCell align="left" style={{ padding: "8px" }}>
            <RouterLink
              to={`/rituals/${row.id}`}
              className={styles.link}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span className={styles.numbers}>{row.id}</span>
              {row.isHeartbeat && (
                <span style={{
                  background: 'rgba(107, 114, 128, 0.1)',
                  color: '#6B7280',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 500,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.025em'
                }}>
                  Heartbeat
                </span>
              )}
            </RouterLink>
          </TableCell>
          <TableCell align="left" style={{ padding: "8px", whiteSpace: "nowrap" }}>
            <Tooltip title={Data.formatDate(row.updateTime)}>
              <span>{Data.calculateTimeMoment(row.updateTime)}</span>
            </Tooltip>
          </TableCell>
          <TableCell align="left" style={{ padding: "8px" }}>
            <Link
              underline="hover"
              href={Utils.getDomain() + "?user=" + row.authority}
              className={styles.link}
            >
              {Data.formatString(row.authority)}
            </Link>
            <Tooltip title="Copied">
              <CopyButton
                onClick={(e) => copyToClipBoard(row.authority)}
              />
            </Tooltip>
          </TableCell>
          <TableCell align="left" style={{ padding: "8px" }}>
            <span className={styles.numbers} >{row.totalParticipants}</span>
          </TableCell>
          <TableCell align="left" style={{ padding: "8px" }}>
            <span className={styles.numbers} >{row.totalPostedTranscripts}</span>
          </TableCell>
          <TableCell align="left" style={{ padding: "8px" }}>
            <span className={styles.numbers}>{row.totalPostedAggregations}</span>
          </TableCell>
          <TableCell align="left" style={{ color:getColorByStatus(row.status), padding: "8px" }}>
            {row.status}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box style={{ 
                backgroundColor: '#FAFBFC',
                padding: '32px',
                borderTop: '2px solid #96FF5E'
              }}>
                <div className={styles.detail_item} style={{ flexDirection: 'column', gap: '32px' }}>
                  {/* Timeline Section */}
                  <div style={{ 
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}>
                    <TransactionTimeline
                      className={styles.timeline}
                      transactions={row.transactions}
                      network={network}
                    />
                  </div>
                  
                  {/* Details Section */}
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    padding: '28px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ marginBottom: '32px' }}>
                      <h3 style={{ 
                        margin: '0 0 24px 0', 
                        fontSize: '1.25rem',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        color: '#111827',
                        letterSpacing: '-0.01em'
                      }}>
                        Ritual Details
                      </h3>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '24px',
                        rowGap: '20px'
                      }}>
                        <div>
                          <div style={{ 
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            color: '#6B7280',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.025em',
                            fontFamily: 'var(--font-display)'
                          }}>
                            DKG ID
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: '#111827', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {row.id}
                            {row.isHeartbeat && (
                              <span style={{
                                background: 'rgba(107, 114, 128, 0.1)',
                                color: '#6B7280',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 500,
                                fontFamily: 'var(--font-mono)',
                                letterSpacing: '0.025em'
                              }}>
                                Heartbeat
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div style={{ 
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            color: '#6B7280',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.025em',
                            fontFamily: 'var(--font-display)'
                          }}>
                            Threshold
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: '#111827', fontWeight: 500 }}>{row.threshold}</div>
                        </div>
                        <div>
                          <div style={{ 
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            color: '#6B7280',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.025em',
                            fontFamily: 'var(--font-display)'
                          }}>
                            DKG Size
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: '#111827', fontWeight: 500 }}>{row.dkgSize}</div>
                        </div>
                        <div>
                          <div style={{ 
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            color: '#6B7280',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.025em',
                            fontFamily: 'var(--font-display)'
                          }}>
                            Initiator
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Link
                              target="_blank"
                              underline="hover"
                              href={Utils.getPolygonScanAddressLink() + row.initiator}
                              className={styles.link}
                              style={{ fontSize: '0.9375rem', fontWeight: 500 }}
                            >
                              {Data.formatString(row.initiator)}
                              <ShareLink style={{ marginLeft: '6px', width: '14px', height: '14px', opacity: 0.7 }} />
                            </Link>
                            <CopyButton
                              onClick={(e) => copyToClipBoard(row.initiator)}
                            />
                          </div>
                        </div>
                        <div>
                          <div style={{ 
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            color: '#6B7280',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.025em',
                            fontFamily: 'var(--font-display)'
                          }}>
                            Access Controller
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Link
                              target="_blank"
                              underline="hover"
                              href={Utils.getPolygonScanAddressLink() + row.accessController}
                              className={styles.link}
                              style={{ fontSize: '0.9375rem', fontWeight: 500 }}
                            >
                              {Data.formatString(row.accessController)}
                              <ShareLink style={{ marginLeft: '6px', width: '14px', height: '14px', opacity: 0.7 }} />
                            </Link>
                            <CopyButton
                              onClick={(e) => copyToClipBoard(row.accessController)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: '36px' }}>
                      <h3 style={{ 
                        margin: '0 0 20px 0', 
                        fontSize: '1.25rem',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        color: '#111827',
                        letterSpacing: '-0.01em'
                      }}>
                        Participants
                      </h3>
                      <Table size="small" style={{ backgroundColor: '#FAFBFC', borderRadius: '8px', overflow: 'hidden' }}>
                        <TableHead>
                          <TableRow style={{ backgroundColor: '#F3F4F6' }}>
                            <TableCell style={{
                              fontFamily: 'var(--font-display)',
                              fontWeight: 500,
                              fontSize: '0.8125rem',
                              letterSpacing: '0.025em',
                              color: '#6B7280',
                              textTransform: 'uppercase',
                              borderBottom: '1px solid #E5E7EB',
                              padding: '14px 20px'
                            }}>
                              Participant
                            </TableCell>
                            <TableCell style={{
                              fontFamily: 'var(--font-display)',
                              fontWeight: 500,
                              fontSize: '0.8125rem',
                              letterSpacing: '0.025em',
                              color: '#6B7280',
                              textTransform: 'uppercase',
                              borderBottom: '1px solid #E5E7EB',
                              padding: '14px 20px'
                            }}>
                              Operator
                            </TableCell>
                            <TableCell style={{
                              fontFamily: 'var(--font-display)',
                              fontWeight: 500,
                              fontSize: '0.8125rem',
                              letterSpacing: '0.025em',
                              color: '#6B7280',
                              textTransform: 'uppercase',
                              borderBottom: '1px solid #E5E7EB',
                              padding: '14px 20px'
                            }}>
                              Transcript Status
                            </TableCell>
                            <TableCell style={{
                              fontFamily: 'var(--font-display)',
                              fontWeight: 500,
                              fontSize: '0.8125rem',
                              letterSpacing: '0.025em',
                              color: '#6B7280',
                              textTransform: 'uppercase',
                              borderBottom: '1px solid #E5E7EB',
                              padding: '14px 20px'
                            }}>
                              Aggregation Status
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {row.participants.map((participant, index) => (
                            <TableRow key={participant} style={{ 
                              borderBottom: index < row.participants.length - 1 ? '1px solid #F3F4F6' : 'none',
                              backgroundColor: '#FFFFFF'
                            }}>
                              <TableCell style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <Link
                                    target="_blank"
                                    underline="hover"
                                    href={Utils.getPolygonScanAddressLink() + participant}
                                    className={styles.link}
                                    style={{ fontSize: '0.9375rem', fontWeight: 500 }}
                                  >
                                    {Data.formatString(participant)}
                                    <ShareLink style={{ marginLeft: '6px', width: '14px', height: '14px', opacity: 0.7 }} />
                                  </Link>
                                  <CopyButton
                                    onClick={(e) => copyToClipBoard(participant)}
                                  />
                                </div>
                              </TableCell>
                              <TableCell style={{ padding: '16px 20px', fontSize: '0.9375rem', fontFamily: 'var(--font-mono)', color: '#374151' }}>
                                {row.operatorAddresses && row.operatorAddresses[participant] ? (
                                  row.operatorAddresses[participant] !== "-" ? (
                                    Data.formatString(row.operatorAddresses[participant])
                                  ) : (
                                    <span style={{ color: '#9CA3AF' }}>-</span>
                                  )
                                ) : (
                                  <span style={{ color: '#9CA3AF' }}>-</span>
                                )}
                              </TableCell>
                              <TableCell style={{ padding: '16px 20px' }}>
                                {row.transcripts && row.transcripts.includes(participant) ? (
                                  <span style={{ 
                                    color: "#10B981",
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    fontFamily: 'var(--font-display)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '4px 10px',
                                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                                    borderRadius: '4px'
                                  }}>
                                    <span style={{ 
                                      width: '6px', 
                                      height: '6px', 
                                      borderRadius: '50%',
                                      backgroundColor: '#10B981'
                                    }}></span>
                                    Posted
                                  </span>
                                ) : (
                                  <span style={{ 
                                    color: "#6B7280",
                                    fontWeight: 500,
                                    fontSize: '0.875rem',
                                    fontFamily: 'var(--font-display)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}>
                                    <span style={{ 
                                      width: '6px', 
                                      height: '6px', 
                                      borderRadius: '50%',
                                      backgroundColor: '#9CA3AF'
                                    }}></span>
                                    Pending
                                  </span>
                                )}
                              </TableCell>
                              <TableCell style={{ padding: '16px 20px' }}>
                                {row.aggregations && row.aggregations.includes(participant) ? (
                                  <span style={{ 
                                    color: "#10B981",
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    fontFamily: 'var(--font-display)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '4px 10px',
                                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                                    borderRadius: '4px'
                                  }}>
                                    <span style={{ 
                                      width: '6px', 
                                      height: '6px', 
                                      borderRadius: '50%',
                                      backgroundColor: '#10B981'
                                    }}></span>
                                    Posted
                                  </span>
                                ) : (
                                  <span style={{ 
                                    color: "#6B7280",
                                    fontWeight: 500,
                                    fontSize: '0.875rem',
                                    fontFamily: 'var(--font-display)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}>
                                    <span style={{ 
                                      width: '6px', 
                                      height: '6px', 
                                      borderRadius: '50%',
                                      backgroundColor: '#9CA3AF'
                                    }}></span>
                                    Pending
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </React.Fragment>
    );
  }

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <Box>
            <Paper>
              <TableContainer>
                <Table
                  className={styles.table}
                  style={{ minWidth: 750 }}
                  aria-labelledby="tableTitle"
                  size={"small"}
                >
                  <EnhancedTableHead
                    order={order}
                    orderBy={orderBy}
                    onRequestSort={handleRequestSort}
                    rowCount={rowData.length}
                  />
                  <TableBody>
                    {stableSort(rowData, getComparator(order, orderBy))
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage
                      )
                      .map((row, index) => {
                        return <Row key={index} row={row} />;
                      })}
                    {emptyRows > 0 && (
                      <TableRow
                        style={{
                          height: 35 * emptyRows,
                        }}
                      >
                        <TableCell colSpan={8} />
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {rowData.length == 0 ? (
                  <div className={styles.nodata}>No data</div>
                ) : (
                  <div></div>
                )}
              </TableContainer>
              {rowData.length > 0 ? (
                <TablePagination
                  className={styles.pagination}
                  rowsPerPageOptions={[25, 50, 100]}
                  component="div"
                  count={rows.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              ) : (
                <div></div>
              )}
            </Paper>
          </Box>
        </>
      )}
    </>
  );
};

export default RitualTable;
