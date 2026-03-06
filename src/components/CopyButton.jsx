import React, { forwardRef } from 'react';
import { ReactComponent as CopySvg } from "../assets/copy.svg";

// Wrap the SVG component with forwardRef
const ForwardedCopy = forwardRef((props, ref) => (
  <CopySvg ref={ref} {...props} />
));

ForwardedCopy.displayName = 'ForwardedCopy';

const CopyButton = forwardRef(({ onClick, style, ...props }, ref) => (
  <button
    ref={ref}
    onClick={onClick}
    style={{ 
      cursor: "pointer", 
      background: "none",
      border: "none",
      padding: "2px",
      display: "inline-flex",
      alignItems: "center",
      opacity: 0,
      transition: "opacity 0.15s ease",
      width: "14px",
      height: "14px",
      ...style 
    }}
    onMouseEnter={(e) => e.target.style.opacity = "0.6"}
    onMouseLeave={(e) => e.target.style.opacity = "0"}
    {...props}
  >
    <ForwardedCopy style={{ width: "12px", height: "12px" }} />
  </button>
));

CopyButton.displayName = 'CopyButton';

export default CopyButton; 