import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { formatCurrencyCompact } from '../../lib/currency';

const BalanceHero = ({ balance = 0, trend = 'stable', accountNumber = '', isMobile = false }) => {
  const [displayBalance, setDisplayBalance] = useState(0);
  const [obscure, setObscure] = useState(false);
  const previousBalance = useRef(0);

  useEffect(() => {
    const start = previousBalance.current;
    const end = balance;
    const duration = 900;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayBalance(start + (end - start) * easeOutQuart);
      if (progress < 1) requestAnimationFrame(animate);
      else previousBalance.current = end;
    };

    requestAnimationFrame(animate);
  }, [balance]);

  const generateTracePath = () => {
    const width = 300;
    const height = 60;
    const points = [];
    const segments = 24;

    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * width;
      const baseVariation = Math.sin(i * 0.5) * 7 + Math.sin(i * 1.1) * 3;
      const trendOffset = trend === 'rising' ? (i / segments) * 18 :
        trend === 'falling' ? -(i / segments) * 18 : 0;
      const y = height / 2 + baseVariation + trendOffset;
      points.push(`${x},${y}`);
    }
    return `M ${points.join(' L ')}`;
  };

  const generateFillPath = () => {
    const width = 300;
    const height = 60;
    const points = [];
    const segments = 24;

    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * width;
      const baseVariation = Math.sin(i * 0.5) * 7 + Math.sin(i * 1.1) * 3;
      const trendOffset = trend === 'rising' ? (i / segments) * 18 :
        trend === 'falling' ? -(i / segments) * 18 : 0;
      const y = height / 2 + baseVariation + trendOffset;
      points.push(`${x},${y}`);
    }
    return `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`;
  };

  const trendLabel = trend === 'rising' ? '+5.2% today' : trend === 'falling' ? '−2.1% today' : 'Stable';
  const trendColor = trend === 'rising' ? 'text-emerald-300' : trend === 'falling' ? 'text-rose-300' : 'text-white/50';

  return (
    <div
      className={`relative rounded-2xl border border-blue-500/25 overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-glow-blue ${isMobile ? 'min-h-[168px] p-5' : 'min-h-[200px] p-6 lg:col-span-2'
        }`}
      style={{
        background: 'linear-gradient(135deg, #1a2e5a 0%, #0f1f45 40%, #0a1530 100%)',
      }}
    >
      {/* Atmospheric glow orbs */}
      <div className="absolute -top-8 -right-8 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-4 w-40 h-40 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top: label + eye toggle */}
      <div className="relative z-10 flex justify-between items-center mb-3">
        <span className="text-[10px] font-medium text-white/50 uppercase tracking-[0.14em]">
          Total Balance
        </span>
        <button
          onClick={() => setObscure(!obscure)}
          className="text-white/35 hover:text-white/60 transition-colors focus:outline-none p-0.5 rounded"
          type="button"
          aria-label={obscure ? 'Show balance' : 'Hide balance'}
        >
          {obscure ? <EyeOff size={12} /> : <Eye size={12} />}
        </button>
      </div>

      {/* Balance number */}
      <div className="relative z-10 flex items-end gap-3 mb-1">
        <h2
          className="font-display font-black text-white leading-none tracking-tight"
          style={{ fontSize: isMobile ? '2.5rem' : '3.25rem', letterSpacing: '-0.03em' }}
        >
          {obscure
            ? <span className="tracking-widest text-white/60">••••••</span>
            : formatCurrencyCompact(displayBalance)
          }
        </h2>
      </div>

      {/* Trend + account footer */}
      <div className="relative z-10 flex items-center justify-between mt-auto">
        {!obscure && (
          <span className={`text-[11px] font-semibold ${trendColor}`}>
            {trendLabel}
          </span>
        )}
        {accountNumber && !obscure && (
          <span className="font-mono text-[10px] text-white/35 tracking-wider ml-auto">
            •••• {accountNumber.slice(-4)}
          </span>
        )}
      </div>

      {/* Chart overlay — anchored to bottom */}
      {!obscure && (
        <div className="absolute left-0 right-0 bottom-0 h-[72px] pointer-events-none select-none z-0">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 300 60"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.14" />
                <stop offset="100%" stopColor="#93c5fd" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={generateFillPath()} fill="url(#heroFill)" />
            <path
              d={generateTracePath()}
              fill="none"
              stroke="rgba(147,197,253,0.55)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default BalanceHero;
