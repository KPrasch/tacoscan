import React from 'react';
import styles from './IconButton.module.css';

const IconButton = ({ 
  children, 
  onClick,
  color = 'default',
  size = 'medium',
  disabled = false,
  className = '',
  ...props 
}) => {
  const classNames = [
    styles.iconButton,
    styles[color],
    styles[size],
    disabled ? styles.disabled : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button 
      className={classNames}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default IconButton;