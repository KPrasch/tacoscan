import React from 'react';

const TacoLogo = ({ width = 108, height = 28, fill = "black", ...props }) => (
  <svg 
    width={width} 
    height={height} 
    viewBox="0 0 108 28" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* T - First letter (0-27) */}
    <rect x="1.34594" y="3.43201" width="1.34594" height="21.136" fill={fill} />
    <rect x="3.43447" y="0" width="21.1426" height="1.34498" fill={fill} />
    <rect x="3.43447" y="26.655" width="21.1426" height="1.345" fill={fill} />
    <rect x="12.6577" y="3.43201" width="1.346" height="21.136" fill={fill} />
    <rect x="26.6614" y="3.43201" width="1.3459" height="21.136" fill={fill} />
    
    {/* A - Second letter (28-54) */}
    <rect x="28.0073" y="3.43201" width="1.3459" height="21.136" fill={fill} />
    <rect x="30.0959" y="0" width="21.1426" height="1.34498" fill={fill} />
    <rect x="30.0959" y="26.655" width="21.1426" height="1.345" fill={fill} />
    <rect x="30.0959" y="13" width="21.1426" height="1.345" fill={fill} />
    <rect x="53.327" y="3.43201" width="1.346" height="21.136" fill={fill} />
    
    {/* C - Third letter (54-80) */}
    <rect x="54.673" y="3.43201" width="1.346" height="21.136" fill={fill} />
    <rect x="56.7615" y="0" width="21.1426" height="1.34498" fill={fill} />
    <rect x="56.7615" y="26.655" width="21.1426" height="1.345" fill={fill} />
    
    {/* O - Fourth letter (81-108) */}
    <rect x="79.9884" y="3.43201" width="1.346" height="21.136" fill={fill} />
    <rect x="83.4229" y="0" width="21.1426" height="1.34498" fill={fill} />
    <rect x="83.4229" y="26.655" width="21.1426" height="1.345" fill={fill} />
    <rect x="106.654" y="3.43201" width="1.346" height="21.136" fill={fill} />
  </svg>
);

export default TacoLogo;