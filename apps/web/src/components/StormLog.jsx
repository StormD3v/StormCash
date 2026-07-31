import React from 'react';
import { motion } from 'framer-motion';

const StormLog = ({ transactions = [] }) => {
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

  // Generate mock transactions if none provided
  const mockTransactions = [
    { id: 'tx_001', transaction_type: 'Deposit', amount: 500.00, created_at: new Date(Date.now() - 1000 * 60 * 5), direction: 'credit' },
    { id: 'tx_002', transaction_type: 'Transfer', amount: -150.00, created_at: new Date(Date.now() - 1000 * 60 * 60 * 2), direction: 'debit' },
    { id: 'tx_003', transaction_type: 'Deposit', amount: 1000.00, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24), direction: 'credit' },
    { id: 'tx_004', transaction_type: 'Withdraw', amount: -200.00, created_at: new Date(Date.now() - 1000 * 60 * 60 * 48), direction: 'debit' },
  ];

  // Map API transactions to our format
  const mappedTransactions = transactions.map(tx => {
    const type = tx.transaction_type.charAt(0).toUpperCase() + tx.transaction_type.slice(1);
    const isCredit = tx.transaction_type === 'deposit';
    return {
      id: tx.reference_id || tx.id,
      type: type,
      amount: isCredit ? 0 : 0, // Amount would need to come from ledger entries
      timestamp: tx.created_at ? new Date(tx.created_at) : new Date(),
      direction: isCredit ? 'credit' : 'debit',
    };
  });

  const displayTransactions = mappedTransactions.length > 0 ? mappedTransactions : mockTransactions;

  return (
    <div className="w-full">
      <h2 className="font-display text-lg font-semibold mb-4 text-text-hi">
        Recent Activity
      </h2>
      
      <div className="relative">
        {/* Vertical connecting line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-storm-dim" />
        
        {/* Transaction entries */}
        <div className="space-y-0">
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
                className={`absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 ${
                  tx.direction === 'credit' 
                    ? 'bg-gold border-gold-dim' 
                    : 'bg-storm border-storm-dim'
                }`}
              />
              
              {/* Transaction details */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-text-hi">
                    {tx.type}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
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
                    className={`font-display font-semibold ${
                      tx.direction === 'credit' ? 'text-gold' : 'text-storm'
                    }`}
                  >
                    {tx.direction === 'credit' ? '+' : ''}{tx.amount.toFixed(2)}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StormLog;