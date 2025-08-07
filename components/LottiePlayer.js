'use client';
import React, { useEffect } from 'react';

const LottiePlayer = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@lottiefiles/dotlottie-wc@0.6.2/dist/dotlottie-wc.js';
    script.type = 'module';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <dotlottie-wc
      src="https://lottie.host/aa356cd0-23ca-45fe-ae90-4c851ed80500/6av1F3FJoZ.lottie"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        objectFit: 'cover'
      }}
      speed="1"
      autoplay
      loop
    ></dotlottie-wc>
  );
};

export default LottiePlayer;
