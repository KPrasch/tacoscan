import React, { useRef, useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import animationData from '../../public/lottie/data_logo.json';

const TacoLogoAnimated = ({ 
  width = 108, 
  height = 28, 
  loop = false, 
  autoplay = true,
  onAnimationComplete,
  className = '',
  ...props 
}) => {
  const lottieRef = useRef();
  const [key, setKey] = useState(0);

  const handleComplete = () => {
    if (onAnimationComplete) {
      onAnimationComplete();
    }
  };

  const handleMouseEnter = () => {
    // Restart animation on hover by forcing a re-render
    if (!loop && lottieRef.current) {
      setKey(prev => prev + 1);
    }
  };

  // The animation is 1440x920
  // The TACO logo appears to be centered in the frame
  // We need to crop and scale it to fit our target dimensions
  
  // Calculate scale to fit the height (28px)
  // The logo in the animation is approximately 100px tall, centered vertically
  const logoHeightInAnimation = 100;
  const scale = height / logoHeightInAnimation;
  
  return (
    <div 
      className={className} 
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer'
      }}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      <Lottie
        key={key}
        lottieRef={lottieRef}
        animationData={animationData}
        loop={loop}
        autoplay={autoplay}
        onComplete={handleComplete}
        style={{
          position: 'absolute',
          width: `${1440 * scale}px`,
          height: `${920 * scale}px`,
          // Center the animation
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }}
        rendererSettings={{
          preserveAspectRatio: 'xMidYMid meet'
        }}
      />
    </div>
  );
};

export default TacoLogoAnimated;