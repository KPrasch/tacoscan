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
      padding: 0,
      display: "inline-flex",
      alignItems: "center",
      ...style 
    }}
    {...props}
  >
    <ForwardedCopy />
  </button>
));

CopyButton.displayName = 'CopyButton';

export default CopyButton; 