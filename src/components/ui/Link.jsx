import React from 'react';
import styles from './Link.module.css';

const Link = ({ 
  children, 
  href,
  onClick,
  underline = 'always',
  color = 'primary',
  className = '',
  ...props 
}) => {
  const classNames = [
    styles.link,
    styles[`underline${underline.charAt(0).toUpperCase() + underline.slice(1)}`],
    styles[color],
    className
  ].filter(Boolean).join(' ');

  return (
    <a 
      href={href}
      onClick={onClick}
      className={classNames}
      {...props}
    >
      {children}
    </a>
  );
};

export default Link;