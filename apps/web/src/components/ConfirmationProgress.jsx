import React from 'react';
import { motion } from 'framer-motion';

const ConfirmationProgress = ({ current, total = 12 }) => {
  const percentage = Math.min((current / total) * 100, 100);
  const isComplete = current >= total;

  return (
    <div className="w-full" role="status" aria-label={`${current} of ${total} confirmations`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-mid">
          Confirmations
        </span>
        <span
          className={`text-xs font-semibold tabular-nums ${isComplete ? 'text-[#7dc9a0]' : 'text-text-hi'}`}
        >
          {current} / {total}
        </span>
      </div>

      {/* Progress track */}
      <div className="h-1.5 bg-storm-dim/60 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${isComplete ? 'bg-[#7dc9a0]' : 'bg-gold'}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      {/* Block dots */}
      <div className="flex gap-0.5 mt-2" aria-hidden="true">
        {Array.from({ length: total }).map((_, i) => (
          <motion.div
            key={i}
            className={`flex-1 h-0.5 rounded-sm ${i < current ? (isComplete ? 'bg-[#7dc9a0]' : 'bg-gold') : 'bg-storm-dim/50'}`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: i < current ? 1 : 0.6 }}
            transition={{ delay: i * 0.04, duration: 0.2 }}
          />
        ))}
      </div>

      {isComplete && (
        <motion.p
          className="mt-2 text-[11px] text-[#7dc9a0] font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          ✓ Network Finalized
        </motion.p>
      )}
    </div>
  );
};

export default ConfirmationProgress;
