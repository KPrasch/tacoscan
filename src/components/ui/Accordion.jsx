import React, { useState } from 'react';
import styles from './Accordion.module.css';

export const Accordion = ({ 
  children, 
  expanded = false,
  onChange,
  className = '',
  ...props 
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);

  React.useEffect(() => {
    setIsExpanded(expanded);
  }, [expanded]);

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (onChange) {
      onChange(null, newState);
    }
  };

  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { isExpanded, onToggle: handleToggle });
    }
    return child;
  });

  return (
    <div className={`${styles.accordion} ${className}`} {...props}>
      {childrenWithProps}
    </div>
  );
};

export const AccordionSummary = ({ 
  children,
  expandIcon,
  isExpanded,
  onToggle,
  className = '',
  ...props 
}) => {
  return (
    <button 
      className={`${styles.accordionSummary} ${className}`}
      onClick={onToggle}
      aria-expanded={isExpanded}
      {...props}
    >
      <div className={styles.summaryContent}>{children}</div>
      {expandIcon && (
        <div className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}>
          {expandIcon}
        </div>
      )}
    </button>
  );
};

export const AccordionDetails = ({ 
  children,
  isExpanded,
  className = '',
  ...props 
}) => {
  return (
    <div 
      className={`${styles.accordionDetails} ${isExpanded ? styles.expanded : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default {
  Accordion,
  AccordionSummary,
  AccordionDetails
};