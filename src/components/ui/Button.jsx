import React from 'react';
import styles from './Button.module.css';

const Button = ({ 
  children, 
  variant = 'contained', 
  color = 'primary',
  onClick,
  disabled = false,
  size = 'medium',
  startIcon,
  endIcon,
  className = '',
  ...props 
}) => {
  const classNames = [
    styles.button,
    styles[variant],
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
      {startIcon && <span className={styles.startIcon}>{startIcon}</span>}
      {children}
      {endIcon && <span className={styles.endIcon}>{endIcon}</span>}
    </button>
  );
};

export default Button;