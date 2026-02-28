import React, { useMemo } from "react";
import { useTable } from "react-table";
import { Link as RouterLink } from "react-router-dom";
import Loader from "../loader";
import styles from "./styles.module.css";
import CopyButton from "../CopyButton";
import PropTypes from "prop-types";
import * as Data from "../../pages/data";
import * as Utils from "../../utils/utils";
import {
  Tooltip,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Paper,
  Link
} from "../ui";

export const NodesTable = ({ columns, data, isLoading, network }) => {
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
          {columns.map((headCell) => (
            <TableCell
              className={styles.th}
              key={headCell.accessor}
              align={"left"}
              sortDirection={orderBy === headCell.accessor ? order : false}
            >
              {headCell.accessor == "id" ||
              headCell.accessor == "registeredOperatorAddress" ||
              headCell.accessor == "authorizedAmount" ||
              headCell.accessor == "stakedAmount" ||
              headCell.accessor == "bondedAt" ? (
                <TableSortLabel
                  direction={orderBy === headCell.accessor ? order : "desc"}
                  onClick={createSortHandler(headCell.accessor)}
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
  const [orderBy, setOrderBy] = React.useState("tBTCAuthorizedAmount");
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

    return (
      <React.Fragment>
        <TableRow
          hover
          tabIndex={-1}
          key={row.name}
          className={open ? styles.rowSeleted : null}
        >
          <TableCell align="left">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RouterLink
                to={`/node/${row.id}`}
                className={styles.link}
              >
                {Data.formatString(row.id)}
              </RouterLink>
              {row.isBetaStaker && (
                <span className="badge badgeData">
                  DATA
                </span>
              )}
              <Tooltip title="Copied">
                <CopyButton
                  onClick={(e) => copyToClipBoard(row.id)}
                />
              </Tooltip>
            </div>
          </TableCell>
          <TableCell align="left">
            <RouterLink
              to={`/node/${row.id}`}
              className={styles.link}
            >
              {Data.formatString(row.registeredOperatorAddress)}
            </RouterLink>
            <Tooltip title="Copied">
              <CopyButton
                onClick={(e) => copyToClipBoard(row.registeredOperatorAddress)}
              />
            </Tooltip>
          </TableCell>
          <TableCell align="left">
            <span className={styles.numbers}>
              {Data.formatWeiDecimal(row.authorizedAmount)}
            </span>
          </TableCell>
          <TableCell align="left">
            <span className={styles.numbers}>
              {Data.formatWeiDecimal(row.stakedAmount)}
            </span>
          </TableCell>
          <TableCell align="left" style={{ textAlign: "center", fontSize: "11px", color: "var(--text-secondary)" }}>
            {row.isOperatorConfirmed === true ? (
              <Tooltip title={"operator address is registered"}>
                <span style={{ color: "var(--status-active)", fontWeight: "600" }}>YES</span>
              </Tooltip>
            ) : (
              <Tooltip title={"operator address is not registered"}>
                <span style={{ color: "var(--status-slashed)", fontWeight: "600" }}>NO</span>
              </Tooltip>
            )}
          </TableCell>
          <TableCell align="left">
            {row.bondedAt ? Data.formatTimeToText(row.bondedAt) : "-"}
          </TableCell>
          <TableCell align="left">
            <span className={`badge ${
              row.nodeStatus === 'Slashed' ? 'badgeSlashed' :
              row.nodeStatus === 'Penalized' ? 'badgePenalized' :
              row.nodeStatus === 'Released' ? 'badgeReleased' : 'badgeActive'
            }`}>
              {row.nodeStatus || 'Active'}
            </span>
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
                        <TableCell colSpan={7} />
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

export default NodesTable;
