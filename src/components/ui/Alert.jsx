import React from 'react';
import styles from './Alert.module.css';

const Alert = ({ 
  children, 
  severity = 'info',
  onClose,
  className = '',
  ...props 
}) => {
  const classNames = [
    styles.alert,
    styles[severity],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames} role="alert" {...props}>
      <div className={styles.message}>{children}</div>
      {onClose && (
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;