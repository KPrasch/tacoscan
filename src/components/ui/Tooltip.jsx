import React, { useState } from 'react';
import styles from './Tooltip.module.css';

const Tooltip = ({ 
  children, 
  title,
  placement = 'top',
  arrow = false,
  className = '',
  ...props 
}) => {
  const [visible, setVisible] = useState(false);

  const showTooltip = () => setVisible(true);
  const hideTooltip = () => setVisible(false);

  return (
    <div 
      className={styles.tooltipWrapper}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      {...props}
    >
      {children}
      {visible && title && (
        <div className={`${styles.tooltip} ${styles[placement]} ${className}`}>
          {arrow && <div className={`${styles.arrow} ${styles[placement]}`} />}
          <div className={styles.content}>{title}</div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;