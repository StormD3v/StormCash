import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const Sky = ({ trend = 'stable', trigger = null, height = '200px' }) => {
  // Generate star field with randomized positions and twinkle timing
  const stars = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 60, // Keep stars in upper portion
      size: Math.random() * 2 + 1,
      delay: Math.random() * 3,
      duration: Math.random() * 2 + 2,
    }));
  }, []);

  // Gradient colors based on trend
  const gradientColors = {
    rising: 'linear-gradient(to bottom, #12151c, #191d26, rgba(217, 163, 92, 0.1))',
    falling: 'linear-gradient(to bottom, #12151c, #191d26, rgba(118, 136, 168, 0.1))',
    stable: 'linear-gradient(to bottom, #12151c, #191d26, #191d26)',
  };

  const gradientStyle = gradientColors[trend] || gradientColors.stable;

  return (
    <div 
      className="relative overflow-hidden"
      style={{ height, background: gradientStyle }}
    >
      {/* Star field - always twinkling */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Cloud shapes - static position, animate on trigger */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-32 h-16 rounded-full blur-xl"
        style={{ backgroundColor: 'rgba(74, 85, 104, 0.3)' }}
        animate={trigger ? { x: [0, 20, 0] } : {}}
        transition={{ duration: 2, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/3 right-1/4 w-40 h-20 rounded-full blur-2xl"
        style={{ backgroundColor: 'rgba(74, 85, 104, 0.2)' }}
        animate={trigger ? { x: [0, -15, 0] } : {}}
        transition={{ duration: 2.5, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 w-48 h-24 rounded-full blur-3xl"
        style={{ backgroundColor: 'rgba(74, 85, 104, 0.2)' }}
        animate={trigger ? { x: [0, 10, 0] } : {}}
        transition={{ duration: 3, ease: 'easeInOut' }}
      />

      {/* Horizon glow line */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ 
          background: 'linear-gradient(to right, transparent, rgba(118, 136, 168, 0.5), transparent)' 
        }}
      />
      
      {/* Haze effect near horizon */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-20"
        style={{ 
          background: 'linear-gradient(to top, rgba(118, 136, 168, 0.1), transparent)' 
        }}
      />
    </div>
  );
};

export default Sky;