import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { formatCurrencyCompact } from '../lib/currency';

const PressureReading = ({ balance = 0, trend = 'stable', accountNumber = '' }) => {
  const [displayBalance, setDisplayBalance] = useState(0);
  const previousBalance = useRef(0);

  // Count-up animation on mount or balance change
  useEffect(() => {
    const start = previousBalance.current;
    const end = balance;
    const duration = 800; // Snappier animation: 800ms
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
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
      const baseVariation = Math.sin(i * 0.5) * 8; // Slightly compressed amplitude
      const trendOffset = trend === 'rising' ? (i / segments) * 16 :
                         trend === 'falling' ? -(i / segments) * 16 : 0;
      const y = height / 2 + baseVariation + trendOffset;
      points.push(`${x},${y}`);
    }

    return `M ${points.join(' L ')}`;
  };

  // Generate enclosed path for gradient fill
  const generateFillPath = () => {
    const width = 300;
    const height = 60;
    const points = [];
    const segments = 20;

    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * width;
      const baseVariation = Math.sin(i * 0.5) * 8;
      const trendOffset = trend === 'rising' ? (i / segments) * 16 :
                         trend === 'falling' ? -(i / segments) * 16 : 0;
      const y = height / 2 + baseVariation + trendOffset;
      points.push(`${x},${y}`);
    }

    return `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`;
  };

  const traceColor = trend === 'rising' ? '#d9a35c' :
                      trend === 'falling' ? '#7688a8' :
                      '#96958f';

  const trendLabel = trend === 'rising' ? 'Rising' :
                     trend === 'falling' ? 'Falling' :
                     'Stable';

  return (
    <div className="w-full">
      {/* Account Info Bar */}
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-mid">Checking Account</span>
        {accountNumber && (
          <span className="font-mono text-[10px] font-semibold text-text-low select-all" title="Click to copy account number">
            •••• {accountNumber.slice(-4)}
          </span>
        )}
      </div>

      {/* Balance number */}
      <div className="flex items-baseline justify-between mb-2.5">
        <motion.div
          className="font-display text-4xl sm:text-5xl font-bold text-text-hi tracking-tighter"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {formatCurrencyCompact(displayBalance)}
        </motion.div>
        <motion.div
          className="text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase"
          style={{
            color: traceColor,
            borderColor: `${traceColor}25`,
            backgroundColor: `${traceColor}08`
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          {trendLabel}
        </motion.div>
      </div>

      {/* Barometric trace */}
      <motion.div
        className="w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <svg
          width="100%"
          height="45"
          viewBox="0 0 300 60"
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="traceGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={traceColor} stopOpacity="0.18" />
              <stop offset="100%" stopColor={traceColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1="15" x2="300" y2="15" stroke="currentColor" strokeWidth="0.5" opacity="0.1" className="text-storm-dim" />
          <line x1="0" y1="30" x2="300" y2="30" stroke="currentColor" strokeWidth="0.5" opacity="0.1" className="text-storm-dim" />
          <line x1="0" y1="45" x2="300" y2="45" stroke="currentColor" strokeWidth="0.5" opacity="0.1" className="text-storm-dim" />

          {/* Glowing Area Fill */}
          <motion.path
            d={generateFillPath()}
            fill="url(#traceGlow)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          />

          {/* Pressure trace line */}
          <motion.path
            d={generateTracePath()}
            fill="none"
            stroke={traceColor}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.3, duration: 0.8, ease: 'easeInOut' }}
          />

          {/* End point indicator with a very soft heartbeat pulse animation */}
          <motion.circle
            cx="300"
            cy={30 + (trend === 'rising' ? 16 : trend === 'falling' ? -16 : 0)}
            r="3"
            fill={traceColor}
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>
      </motion.div>
    </div>
  );
};

export default PressureReading;
