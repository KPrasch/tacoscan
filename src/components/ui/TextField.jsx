import React from 'react';
import styles from './TextField.module.css';

const TextField = ({ 
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error = false,
  helperText,
  disabled = false,
  className = '',
  fullWidth = false,
  variant = 'outlined',
  size = 'medium',
  endAdornment,
  ...props
}) => {
  const containerClasses = [
    styles.container,
    fullWidth ? styles.fullWidth : '',
    className
  ].filter(Boolean).join(' ');

  const inputClasses = [
    styles.input,
    styles[variant],
    styles[size],
    error ? styles.error : '',
    disabled ? styles.disabled : '',
    endAdornment ? styles.withAdornment : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.inputWrapper}>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
          {...props}
        />
        {endAdornment && (
          <div className={styles.endAdornment}>
            {endAdornment}
          </div>
        )}
      </div>
      {helperText && (
        <span className={`${styles.helperText} ${error ? styles.errorText : ''}`}>
          {helperText}
        </span>
      )}
    </div>
  );
};

export default TextField;