import React from 'react';
import styles from './Timeline.module.css';

export const Timeline = ({ children, className = '', ...props }) => {
  return (
    <ul className={`${styles.timeline} ${className}`} {...props}>
      {children}
    </ul>
  );
};

export const TimelineItem = ({ children, className = '', ...props }) => {
  return (
    <li className={`${styles.timelineItem} ${className}`} {...props}>
      {children}
    </li>
  );
};

export const TimelineSeparator = ({ children, className = '', ...props }) => {
  return (
    <div className={`${styles.timelineSeparator} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const TimelineDot = ({ 
  children, 
  color = 'grey',
  variant = 'filled',
  className = '',
  ...props 
}) => {
  const classNames = [
    styles.timelineDot,
    styles[color],
    styles[variant],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
};

export const TimelineConnector = ({ className = '', ...props }) => {
  return (
    <div className={`${styles.timelineConnector} ${className}`} {...props} />
  );
};

export const TimelineContent = ({ children, className = '', ...props }) => {
  return (
    <div className={`${styles.timelineContent} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const TimelineOppositeContent = ({ children, className = '', ...props }) => {
  return (
    <div className={`${styles.timelineOppositeContent} ${className}`} {...props}>
      {children}
    </div>
  );
};

export default {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
  TimelineOppositeContent
};