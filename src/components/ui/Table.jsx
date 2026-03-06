import React from 'react';
import styles from './Table.module.css';

export const Table = ({ children, className = '', ...props }) => {
  return (
    <table className={`${styles.table} ${className}`} {...props}>
      {children}
    </table>
  );
};

export const TableHead = ({ children, className = '', ...props }) => {
  return (
    <thead className={`${styles.tableHead} ${className}`} {...props}>
      {children}
    </thead>
  );
};

export const TableBody = ({ children, className = '', ...props }) => {
  return (
    <tbody className={`${styles.tableBody} ${className}`} {...props}>
      {children}
    </tbody>
  );
};

export const TableRow = ({ children, className = '', hover = false, selected = false, ...props }) => {
  const classNames = [
    styles.tableRow,
    hover ? styles.hover : '',
    selected ? styles.selected : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <tr className={classNames} {...props}>
      {children}
    </tr>
  );
};

export const TableCell = ({ 
  children, 
  align = 'left', 
  padding = 'normal',
  className = '',
  component = 'td',
  sortDirection, // extract but don't pass to DOM
  ...props 
}) => {
  const Component = component;
  const classNames = [
    styles.tableCell,
    styles[`align${align.charAt(0).toUpperCase() + align.slice(1)}`],
    styles[`padding${padding.charAt(0).toUpperCase() + padding.slice(1)}`],
    className
  ].filter(Boolean).join(' ');

  return (
    <Component className={classNames} {...props}>
      {children}
    </Component>
  );
};

export const TableContainer = ({ children, className = '', component = 'div', ...props }) => {
  const Component = component;
  return (
    <Component className={`${styles.tableContainer} ${className}`} {...props}>
      {children}
    </Component>
  );
};

export const TablePagination = ({
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [10, 25, 50],
  className = ''
}) => {
  const totalPages = Math.ceil(count / rowsPerPage);
  
  return (
    <div className={`${styles.tablePagination} ${className}`}>
      <div className={styles.paginationToolbar}>
        <div className={styles.rowsPerPage}>
          <span>Rows per page:</span>
          <select 
            value={rowsPerPage} 
            onChange={(e) => onRowsPerPageChange(e, parseInt(e.target.value))}
            className={styles.select}
          >
            {rowsPerPageOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className={styles.displayedRows}>
          {`${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, count)} of ${count}`}
        </div>
        <div className={styles.paginationActions}>
          <button 
            onClick={(e) => onPageChange(e, page - 1)}
            disabled={page === 0}
            className={styles.paginationButton}
          >
            ‹
          </button>
          <button 
            onClick={(e) => onPageChange(e, page + 1)}
            disabled={page >= totalPages - 1}
            className={styles.paginationButton}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
};

export const TableSortLabel = ({ 
  children, 
  active = false, 
  direction = 'asc',
  onClick,
  className = '',
  ...props 
}) => {
  const classNames = [
    styles.tableSortLabel,
    active ? styles.active : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button className={classNames} onClick={onClick} {...props}>
      {children}
      <span className={styles.sortIcon}>
        {active && (direction === 'asc' ? '↑' : '↓')}
      </span>
    </button>
  );
};

export default {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  TableSortLabel
};