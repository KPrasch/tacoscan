import React from 'react';
import styles from './Paper.module.css';

const Paper = ({ 
  children, 
  elevation = 1,
  square = false,
  className = '',
  ...props 
}) => {
  const classNames = [
    styles.paper,
    styles[`elevation${elevation}`],
    square ? styles.square : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
};

export default Paper;