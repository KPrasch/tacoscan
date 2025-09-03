import React from 'react';
import styles from './CircularProgress.module.css';

const CircularProgress = ({ 
  size = 40,
  thickness = 3.6,
  color = 'primary',
  className = '',
  ...props 
}) => {
  const classNames = [
    styles.circularProgress,
    styles[color],
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={classNames}
      style={{
        width: size,
        height: size,
        borderWidth: thickness
      }}
      {...props}
    />
  );
};

export default CircularProgress;