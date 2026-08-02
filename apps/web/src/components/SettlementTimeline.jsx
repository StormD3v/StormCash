import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

// ─── Stage definitions (module-level constant) ────────────────────────────────
const STAGES = [
  { key: 'INITIATED', label: 'Initiated' },
  { key: 'CONVERTING_TO_TOKEN', label: 'Converting to Token' },
  { key: 'MINTING_TOKEN', label: 'Minting Token' },
  { key: 'BROADCASTING', label: 'Broadcasting' },
  { key: 'WAITING_CONFIRMATION', label: 'Confirming' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'CONVERTING_TO_FIAT', label: 'Converting to Fiat' },
  { key: 'DEPOSITED', label: 'Deposited' },
];

// ─── SettlementTimeline ───────────────────────────────────────────────────────
const SettlementTimeline = ({ settlementStage, confirmationCount = 0 }) => {
  const currentIndex = STAGES.findIndex((s) => s.key === settlementStage);

  const getStatus = (index) => {
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="w-full" role="status" aria-label={`Settlement stage: ${settlementStage || 'pending'}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-mid mb-4">
        Settlement Progress
      </p>

      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-[9px] top-0 bottom-0 w-px bg-storm-dim/60"
          aria-hidden="true"
        />

        <div className="space-y-3">
          {STAGES.map((stage, index) => {
            const status = getStatus(index);
            const isCompleted = status === 'completed';
            const isCurrent = status === 'current';

            return (
              <motion.div
                key={stage.key}
                className="relative pl-8 flex items-center justify-between"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                /* Single, correct transition — no duplicate */
                transition={{ delay: index * 0.07, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Stage node */}
                <div
                  className={[
                    'absolute left-0 w-[18px] h-[18px] rounded-full border-2',
                    'flex items-center justify-center z-10 text-[9px]',
                    isCompleted
                      ? 'bg-gold border-gold text-ground'
                      : isCurrent
                        ? 'bg-gold/20 border-gold text-gold'
                        : 'bg-ground border-storm-dim/60',
                  ].join(' ')}
                  aria-hidden="true"
                >
                  {isCompleted && <Check size={9} strokeWidth={3} />}
                  {isCurrent && (
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full bg-gold"
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </div>

                {/* Glow behind current node */}
                {isCurrent && (
                  <div
                    className="absolute left-[-3px] w-6 h-6 rounded-full bg-gold/20 blur-sm"
                    aria-hidden="true"
                  />
                )}

                {/* Stage label */}
                <span
                  className={[
                    'text-xs transition-colors duration-200',
                    isCurrent ? 'text-gold font-medium' :
                      isCompleted ? 'text-text-hi' :
                        'text-text-low',
                  ].join(' ')}
                >
                  {stage.label}
                  {stage.key === 'WAITING_CONFIRMATION' && isCurrent && confirmationCount > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-gold/10 text-gold border border-gold/20 tabular-nums">
                      {confirmationCount}/12
                    </span>
                  )}
                </span>

                {/* Checkmark on right for completed */}
                {isCompleted && (
                  <span className="text-[10px] text-text-low" aria-hidden="true">✓</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Complete banner */}
      {settlementStage === 'DEPOSITED' && (
        <motion.div
          className="mt-5 px-4 py-3.5 rounded-xl border border-gold/25 bg-gold/8 text-center"
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-semibold text-gold">Settlement Complete</p>
          <p className="text-xs text-text-mid mt-0.5">Funds delivered to recipient</p>
        </motion.div>
      )}
    </div>
  );
};

export default SettlementTimeline;
