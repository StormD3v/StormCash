import React from 'react';
import { motion } from 'framer-motion';

const StormLog = ({ transactions = [], onTransactionClick }) => {
  // Format relative timestamp
  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Map API transactions to our format
  const mappedTransactions = transactions.map(tx => {
    const type = tx.transaction_type.charAt(0).toUpperCase() + tx.transaction_type.slice(1);
    const isCredit = tx.transaction_type === 'deposit';
    const amount = tx.amount ? parseFloat(tx.amount) : 0;
    return {
      id: tx.reference_id || tx.id,
      transactionId: tx.id, // Keep the actual transaction ID for API calls
      type: type,
      amount: amount,
      timestamp: tx.created_at ? new Date(tx.created_at) : new Date(),
      direction: isCredit ? 'credit' : 'debit',
      settlement_stage: tx.settlement_stage,
    };
  });

  const displayTransactions = mappedTransactions;

  return (
    <div className="w-full">
      <h2 className="font-display text-lg font-semibold mb-6 text-text-hi">
        Recent Activity
      </h2>

      {displayTransactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-mid">
          <div className="text-5xl mb-4 opacity-40">⛓️</div>
          <p className="text-sm font-medium mb-2">No blockchain transfers yet</p>
          <p className="text-xs opacity-60 text-center max-w-xs">
            Your next transfer will appear here and can be tracked through StormChain settlement
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical connecting line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-storm-dim" />

          {/* Transaction entries */}
          <div className="space-y-1">
            {displayTransactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                className="relative pl-10 py-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
              >
                {/* Node dot */}
                <div
                  className={`absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    tx.direction === 'credit'
                      ? 'bg-gold border-gold-dim'
                      : 'bg-storm border-storm-dim'
                  }`}
                >
                  {tx.direction === 'credit' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-ground" />
                  )}
                </div>

                {/* Transaction details */}
                <motion.div
                  className="flex items-center justify-between cursor-pointer hover:bg-storm-dim/10 rounded-lg p-3 -mx-3 transition-colors"
                  onClick={() => onTransactionClick?.(tx.transactionId)}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className="flex-1">
                    <div className="font-medium text-text-hi flex items-center gap-2 mb-1">
                      {tx.type}
                      {tx.settlement_stage && tx.settlement_stage !== 'DEPOSITED' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30">
                          {tx.settlement_stage.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-text-low">
                        {tx.id.slice(0, 8)}...
                      </span>
                      <span className="text-xs text-text-mid">
                        {formatRelativeTime(tx.timestamp)}
                      </span>
                    </div>
                  </div>

                  {tx.amount !== 0 && (
                    <div
                      className={`font-display font-semibold ml-4 ${
                        tx.direction === 'credit' ? 'text-gold' : 'text-storm'
                      }`}
                    >
                      {tx.direction === 'credit' ? '+' : ''}{tx.amount.toFixed(2)}
                    </div>
                  )}
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StormLog;