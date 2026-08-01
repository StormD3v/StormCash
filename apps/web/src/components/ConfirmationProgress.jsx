import React from 'react';
import { motion } from 'framer-motion';

const ConfirmationProgress = ({ current, total = 12 }) => {
  const percentage = (current / total) * 100;
  const isComplete = current >= total;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-text-mid">Network Confirmations</span>
        <span className={`text-sm font-medium ${isComplete ? 'text-gold' : 'text-text-hi'}`}>
          {current} / {total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-storm-dim rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gold rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Visual blocks */}
      <div className="flex gap-1 mt-2">
        {Array.from({ length: total }).map((_, index) => (
          <motion.div
            key={index}
            className={`flex-1 h-1 rounded-sm ${
              index < current
                ? 'bg-gold'
                : 'bg-storm-dim'
            }`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: index < current ? 1 : 0.3,
              scale: index < current ? 1 : 0.8
            }}
            transition={{ delay: index * 0.05 }}
          />
        ))}
      </div>

      {isComplete && (
        <motion.div
          className="mt-2 text-xs text-gold font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          ✓ Network Finalized
        </motion.div>
      )}
    </div>
  );
};

export default ConfirmationProgress;
