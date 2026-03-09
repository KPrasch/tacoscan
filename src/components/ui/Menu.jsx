import React, { useEffect, useRef } from 'react';
import styles from './Menu.module.css';

export const Menu = ({ 
  children, 
  open, 
  onClose,
  anchorEl,
  className = '',
  ...props 
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && !anchorEl?.contains(event.target)) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose, anchorEl]);

  if (!open) return null;

  const positionMenu = () => {
    if (!anchorEl) return {};
    const rect = anchorEl.getBoundingClientRect();
    return {
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX
    };
  };

  return (
    <div 
      ref={menuRef}
      className={`${styles.menu} ${className}`}
      style={positionMenu()}
      {...props}
    >
      <div className={styles.menuList}>
        {children}
      </div>
    </div>
  );
};

export const MenuItem = ({ 
  children, 
  onClick,
  disabled = false,
  className = '',
  ...props 
}) => {
  const classNames = [
    styles.menuItem,
    disabled ? styles.disabled : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={classNames}
      onClick={disabled ? undefined : onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default {
  Menu,
  MenuItem
};