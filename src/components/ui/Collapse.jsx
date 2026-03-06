import React, { useRef, useEffect, useState } from 'react';
import styles from './Collapse.module.css';

const Collapse = ({ 
  children, 
  in: isOpen = false,
  timeout = 300,
  className = '',
  ...props 
}) => {
  const [height, setHeight] = useState(isOpen ? 'auto' : '0px');
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      if (isOpen) {
        const contentHeight = contentRef.current.scrollHeight;
        setHeight(`${contentHeight}px`);
        setTimeout(() => {
          setHeight('auto');
        }, timeout);
      } else {
        const contentHeight = contentRef.current.scrollHeight;
        setHeight(`${contentHeight}px`);
        setTimeout(() => {
          setHeight('0px');
        }, 10);
      }
    }
  }, [isOpen, timeout]);

  return (
    <div 
      className={`${styles.collapse} ${className}`}
      style={{
        height,
        transition: `height ${timeout}ms ease`
      }}
      {...props}
    >
      <div ref={contentRef} className={styles.content}>
        {children}
      </div>
    </div>
  );
};

export default Collapse;