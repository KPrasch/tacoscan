import React, { useState, createContext, useContext, useEffect } from 'react';
import styles from './Tabs.module.css';

const TabContext = createContext();

export const TabProvider = ({ children, value, onChange }) => {
  const [activeTab, setActiveTab] = useState(value || '1');

  useEffect(() => {
    if (value !== undefined) {
      setActiveTab(value);
    }
  }, [value]);

  const handleChange = (newValue) => {
    setActiveTab(newValue);
    if (onChange) {
      onChange(null, newValue);
    }
  };

  return (
    <TabContext.Provider value={{ activeTab, handleChange }}>
      {children}
    </TabContext.Provider>
  );
};

export const useTabContext = () => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('Tab components must be wrapped in TabContext');
  }
  return context;
};

export const TabList = ({ children, className = '', ...props }) => {
  return (
    <div className={`${styles.tabList} ${className}`} role="tablist" {...props}>
      {children}
    </div>
  );
};

export const Tab = ({ label, value, className = '', ...props }) => {
  const { activeTab, handleChange } = useTabContext();
  const isActive = activeTab === value;

  return (
    <button
      className={`${styles.tab} ${isActive ? styles.active : ''} ${className}`}
      onClick={() => handleChange(value)}
      role="tab"
      aria-selected={isActive}
      {...props}
    >
      {label}
    </button>
  );
};

export const TabPanel = ({ children, value, className = '', ...props }) => {
  const { activeTab } = useTabContext();
  
  if (activeTab !== value) {
    return null;
  }

  return (
    <div className={`${styles.tabPanel} ${className}`} role="tabpanel" {...props}>
      {children}
    </div>
  );
};

export default {
  TabContext: TabProvider,
  TabList,
  Tab,
  TabPanel
};