import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check } from 'lucide-react';

const CopyableText = ({ value, maxLength = 8, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — silent fail
    }
  }, [value]);

  const truncated = value && value.length > maxLength
    ? `${value.slice(0, maxLength)}…${value.slice(-4)}`
    : value;

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <span className={`font-mono text-sm ${className}`} title={value}>
        {truncated || 'N/A'}
      </span>
      <button
        onClick={handleCopy}
        className="flex items-center justify-center w-5 h-5 rounded text-text-low hover:text-gold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
        aria-label={copied ? 'Copied' : `Copy ${truncated}`}
        type="button"
      >
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.div
              key="check"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Check size={11} strokeWidth={3} className="text-[#7dc9a0]" aria-hidden="true" />
            </motion.div>
          ) : (
            <motion.div
              key="copy"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Copy size={11} strokeWidth={2} aria-hidden="true" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Tooltip */}
      <AnimatePresence>
        {copied && (
          <motion.div
            className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-[#7dc9a0] text-ground text-[10px] font-medium whitespace-nowrap shadow-md pointer-events-none"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            role="tooltip"
            aria-live="polite"
          >
            Copied!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CopyableText;
