import React from 'react';
import styles from './Stack.module.css';

const Stack = ({ 
  children,
  direction = 'row',
  spacing = 2,
  alignItems = 'stretch',
  justifyContent = 'flex-start',
  className = '',
  ...props 
}) => {
  const style = {
    flexDirection: direction,
    alignItems,
    justifyContent,
    gap: `${spacing * 8}px`
  };

  return (
    <div 
      className={`${styles.stack} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

export default Stack;