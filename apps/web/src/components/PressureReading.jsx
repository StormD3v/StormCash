import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const PressureReading = ({ balance = 0, trend = 'stable' }) => {
  const [displayBalance, setDisplayBalance] = useState(0);
  const previousBalance = useRef(0);

  // Count-up animation on mount or balance change
  useEffect(() => {
    const start = previousBalance.current;
    const end = balance;
    const duration = 1000; // 1 second animation
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = start + (end - start) * easeOutQuart;
      
      setDisplayBalance(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        previousBalance.current = end;
      }
    };

    requestAnimationFrame(animate);
  }, [balance]);

  // Generate barometric trace SVG path
  const generateTracePath = () => {
    const width = 300;
    const height = 60;
    const points = [];
    const segments = 20;

    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * width;
      // Add some variation to make it look like a pressure trace
      const baseVariation = Math.sin(i * 0.5) * 10;
      const trendOffset = trend === 'rising' ? (i / segments) * 20 :
                         trend === 'falling' ? -(i / segments) * 20 : 0;
      const y = height / 2 + baseVariation + trendOffset;
      points.push(`${x},${y}`);
    }

    return `M ${points.join(' L ')}`;
  };

  const traceColor = trend === 'rising' ? '#d9a35c' :
                     trend === 'falling' ? '#7688a8' :
                     '#96958f';

  const trendLabel = trend === 'rising' ? 'Rising' :
                    trend === 'falling' ? 'Falling' :
                    'Stable';

  const trendColorClass = trend === 'rising' ? 'text-gold' :
                         trend === 'falling' ? 'text-storm' :
                         'text-text-mid';

  return (
    <div className="w-full">
      {/* Balance number */}
      <div className="flex items-baseline gap-3 mb-2">
        <motion.div 
          className="font-display text-5xl font-semibold text-text-hi"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          ${displayBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </motion.div>
        <motion.div
          className="text-sm font-medium"
          style={{ color: trend === 'rising' ? '#d9a35c' : trend === 'falling' ? '#7688a8' : '#96958f' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {trendLabel}
        </motion.div>
      </div>

      {/* Barometric trace */}
      <motion.div
        className="w-full"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
      >
        <svg 
          width="100%" 
          height="60" 
          viewBox="0 0 300 60"
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          {/* Grid lines */}
          <line x1="0" y1="15" x2="300" y2="15" stroke="currentColor" strokeWidth="0.5" opacity="0.3" className="text-storm-dim" />
          <line x1="0" y1="30" x2="300" y2="30" stroke="currentColor" strokeWidth="0.5" opacity="0.3" className="text-storm-dim" />
          <line x1="0" y1="45" x2="300" y2="45" stroke="currentColor" strokeWidth="0.5" opacity="0.3" className="text-storm-dim" />
          
          {/* Pressure trace line */}
          <motion.path
            d={generateTracePath()}
            fill="none"
            stroke={traceColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.4, duration: 1, ease: 'easeInOut' }}
          />
          
          {/* End point indicator */}
          <motion.circle
            cx="300"
            cy={30 + (trend === 'rising' ? 20 : trend === 'falling' ? -20 : 0)}
            r="4"
            fill={traceColor}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.2, duration: 0.3 }}
          />
        </svg>
      </motion.div>
    </div>
  );
};

export default PressureReading;