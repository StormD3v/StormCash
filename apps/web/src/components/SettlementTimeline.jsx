import React from 'react';
import { motion } from 'framer-motion';

const SettlementTimeline = ({ settlementStage, confirmationCount = 0 }) => {
  const stages = [
    { key: 'INITIATED', label: 'Initiated', shortLabel: 'Initiated' },
    { key: 'CONVERTING_TO_TOKEN', label: 'Converting to StormChain', shortLabel: 'Converting' },
    { key: 'MINTING_TOKEN', label: 'Minting Token', shortLabel: 'Minting' },
    { key: 'BROADCASTING', label: 'Broadcasting', shortLabel: 'Broadcasting' },
    { key: 'WAITING_CONFIRMATION', label: 'Waiting Confirmations', shortLabel: 'Confirming' },
    { key: 'CONFIRMED', label: 'Confirmed', shortLabel: 'Confirmed' },
    { key: 'CONVERTING_TO_FIAT', label: 'Converting Back', shortLabel: 'Converting' },
    { key: 'DEPOSITED', label: 'Deposited', shortLabel: 'Deposited' },
  ];

  const stageIndex = stages.findIndex(s => s.key === settlementStage);
  const currentStageIndex = stageIndex >= 0 ? stageIndex : -1;

  const getStageStatus = (index) => {
    if (index < currentStageIndex) return 'completed';
    if (index === currentStageIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="w-full">
      <h3 className="font-display text-lg font-semibold mb-6 text-text-hi">
        Settlement Progress
      </h3>

      <div className="relative">
        {/* Vertical connecting line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-storm-dim" />

        {/* Stages */}
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const status = getStageStatus(index);
            const isCurrent = status === 'current';
            const isCompleted = status === 'completed';

            return (
              <motion.div
                key={stage.key}
                className="relative pl-10"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                whileHover={{ x: 2 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {/* Stage node */}
                <div
                  className={`absolute left-2 top-0 w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs z-10 ${
                    isCompleted
                      ? 'bg-gold border-gold text-ground'
                      : isCurrent
                      ? 'bg-gold border-gold text-white shadow-lg shadow-gold/30'
                      : 'bg-ground border-storm-dim text-text-low'
                  }`}
                >
                  {isCompleted ? '✓' : ''}
                </div>

                {/* Stage label */}
                <div className="flex items-center justify-between">
                  <span
                    className={`font-medium text-sm ${
                      isCurrent
                        ? 'text-gold'
                        : isCompleted
                        ? 'text-text-hi'
                        : 'text-text-low'
                    }`}
                  >
                    {stage.label}
                  </span>

                  {stage.key === 'WAITING_CONFIRMATION' && confirmationCount > 0 && (
                    <div className="text-xs text-text-mid">
                      {confirmationCount} / 12 confirmations
                    </div>
                  )}
                </div>

                {/* Current stage glow effect */}
                {isCurrent && (
                  <motion.div
                    className="absolute left-2 top-0 w-4 h-4 rounded-full bg-gold opacity-50 blur-md"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Settlement complete message */}
      {settlementStage === 'DEPOSITED' && (
        <motion.div
          className="mt-6 p-4 rounded-xl border border-gold/30 bg-gold/10 text-center"
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <div className="text-2xl mb-2">✅</div>
          <p className="font-medium text-gold">Settlement Complete</p>
          <p className="text-sm text-text-mid mt-1">Funds have been delivered to the recipient</p>
        </motion.div>
      )}
    </div>
  );
};

export default SettlementTimeline;
