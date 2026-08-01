import React, { useState } from 'react';
import { motion } from 'framer-motion';

const CopyableText = ({ value, maxLength = 8, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncated = value && value.length > maxLength
    ? `${value.slice(0, maxLength)}...${value.slice(-4)}`
    : value;

  return (
    <div className="relative inline-flex items-center gap-2">
      <span className={`font-mono text-sm ${className}`}>
        {truncated || 'N/A'}
      </span>
      <button
        onClick={handleCopy}
        className="text-xs text-gold hover:text-gold-dim transition-colors opacity-70 hover:opacity-100"
        title={copied ? 'Copied!' : 'Copy to clipboard'}
      >
        {copied ? '✓' : '📋'}
      </button>
      {copied && (
        <motion.div
          className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-gold text-ground text-xs whitespace-nowrap"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
        >
          Copied!
        </motion.div>
      )}
    </div>
  );
};

export default CopyableText;
