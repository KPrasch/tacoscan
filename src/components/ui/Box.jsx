import React from 'react';
import styles from './Box.module.css';

const Box = ({ children, className = '', sx = {}, ...props }) => {
  const style = {
    ...sx,
    ...(props.style || {})
  };
  
  return (
    <div className={`${styles.box} ${className}`} style={style} {...props}>
      {children}
    </div>
  );
};

export default Box;