import React from 'react';
import styles from './Typography.module.css';

const Typography = ({ 
  children,
  variant = 'body1',
  component,
  align = 'inherit',
  color = 'inherit',
  className = '',
  ...props 
}) => {
  const componentMap = {
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
    subtitle1: 'h6',
    subtitle2: 'h6',
    body1: 'p',
    body2: 'p',
    caption: 'span',
    overline: 'span'
  };

  const Component = component || componentMap[variant] || 'span';

  const classNames = [
    styles.typography,
    styles[variant],
    styles[`align${align.charAt(0).toUpperCase() + align.slice(1)}`],
    styles[`color${color.charAt(0).toUpperCase() + color.slice(1)}`],
    className
  ].filter(Boolean).join(' ');

  return (
    <Component className={classNames} {...props}>
      {children}
    </Component>
  );
};

export default Typography;