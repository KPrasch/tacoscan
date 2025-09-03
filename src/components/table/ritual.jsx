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
            >
              <span className={styles.numbers}>{row.id}</span>
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
        <TableRow className={styles.container_detail}>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box style={{ margin: '8px' }}>
                <div className={styles.detail_item} style={{ flexDirection: 'column' }}>
                  <div style={{ marginBottom: '20px', borderBottom: '1px solid rgba(0, 0, 0, 0.1)', paddingBottom: '20px' }}>
                    <TransactionTimeline
                      className={styles.timeline}
                      transactions={row.transactions}
                      network={network}
                    />
                  </div>
                  <div>
                    <TableContainer className={styles.timeline}>
                      <Table
                        className={styles.table_detail}
                        style={{ minWidth: 750 }}
                        aria-labelledby="tableTitle"
                        size={"small"}
                      >
                        <TableBody>
                          <TableRow style={{ borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>
                            <TableCell style={{ width: '15%' }}>
                              <Typography variant="body2" component="span" style={{ fontWeight: 600, color: 'rgba(0, 0, 0, 0.87)' }}>DKG Id:</Typography>
                              {' '}{row.id}
                            </TableCell>
                            <TableCell style={{ width: '12%' }}>
                              <Typography variant="body2" component="span" style={{ fontWeight: 600, color: 'rgba(0, 0, 0, 0.87)' }}>Threshold:</Typography>
                              {' '}{row.threshold}
                            </TableCell>
                            <TableCell style={{ width: '12%' }}>
                              <Typography variant="body2" component="span" style={{ fontWeight: 600, color: 'rgba(0, 0, 0, 0.87)' }}>DKG Size:</Typography>
                              {' '}{row.dkgSize}
                            </TableCell>
                            <TableCell style={{ width: '25%' }}>
                              <Typography variant="body2" component="span" style={{ fontWeight: 600, color: 'rgba(0, 0, 0, 0.87)' }}>Initiator:</Typography>
                              {' '}
                              <Link
                                target="_blank"
                                underline="hover"
                                href={Utils.getPolygonScanAddressLink() + row.initiator}
                                className={styles.link}
                              >
                                {Data.formatString(row.initiator)}
                                <ShareLink />
                              </Link>
                              <Tooltip title="Copied">
                                <CopyButton
                                  onClick={(e) => copyToClipBoard(row.initiator)}
                                />
                              </Tooltip>
                            </TableCell>
                            <TableCell style={{ width: '25%' }}>
                              <Typography variant="body2" component="span" style={{ fontWeight: 600, color: 'rgba(0, 0, 0, 0.87)' }}>Access Controller:</Typography>
                              {' '}
                              <Link
                                target="_blank"
                                underline="hover"
                                href={Utils.getPolygonScanAddressLink() + row.accessController}
                                className={styles.link}
                              >
                                {Data.formatString(row.accessController)}
                                <ShareLink />
                              </Link>
                              <Tooltip title="Copied">
                                <CopyButton
                                  onClick={(e) => copyToClipBoard(row.accessController)}
                                />
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell colSpan={5} style={{ paddingTop: '16px' }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Participant</TableCell>
                                    <TableCell>Operator</TableCell>
                                    <TableCell>Transcript Status</TableCell>
                                    <TableCell>Aggregation Status</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {row.participants.map((participant) => (
                                    <TableRow key={participant}>
                                      <TableCell>
                                        <Link
                                          target="_blank"
                                          underline="hover"
                                          href={Utils.getPolygonScanAddressLink() + participant}
                                          className={styles.link}
                                        >
                                          {Data.formatString(participant)}
                                          <ShareLink />
                                        </Link>
                                        <Tooltip title="Copied">
                                          <CopyButton
                                            onClick={(e) => copyToClipBoard(participant)}
                                          />
                                        </Tooltip>
                                      </TableCell>
                                      <TableCell>
                                        {row.operatorAddresses[participant] || "-"}
                                      </TableCell>
                                      <TableCell>
                                        {row.transcripts && row.transcripts.includes(participant) ? (
                                          <span style={{ color: "#4caf50" }}>Posted</span>
                                        ) : (
                                          <span style={{ color: "#ff9800" }}>Pending</span>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {row.aggregations && row.aggregations.includes(participant) ? (
                                          <span style={{ color: "#4caf50" }}>Posted</span>
                                        ) : (
                                          <span style={{ color: "#ff9800" }}>Pending</span>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
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
