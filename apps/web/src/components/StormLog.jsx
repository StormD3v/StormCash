import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, ArrowUpFromLine, ArrowDownRight, RefreshCw } from 'lucide-react';
import { formatCurrencyCompact } from '../lib/currency';

const StormLog = ({ transactions = [], onTransactionClick }) => {
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

  const mappedTransactions = transactions.map(tx => {
    // Normalise to Title case: "DEPOSIT" → "Deposit", "TRANSFER" → "Transfer"
    const rawType = (tx.transaction_type || '').toLowerCase();
    const type = rawType.charAt(0).toUpperCase() + rawType.slice(1);
    const direction = tx.direction || (rawType === 'deposit' ? 'credit' : 'debit');
    const amount = tx.amount ? parseFloat(tx.amount) : 0;
    return {
      id: tx.reference_id || tx.id,
      transactionId: tx.id,
      type,
      amount,
      timestamp: tx.created_at ? new Date(tx.created_at) : new Date(),
      direction,
      settlement_stage: tx.settlement_stage,
      fromAccount: tx.from_account_number,
      toAccount: tx.to_account_number,
    };
  });

  const getTxDetails = (tx) => {
    if (tx.type === 'Deposit') {
      return {
        title: 'Deposit',
        description: 'Funds added to account',
        icon: ArrowDownLeft,
        color: 'text-emerald-400',
        bg: 'bg-emerald-400/8',
        border: 'border-emerald-400/15',
      };
    }
    if (tx.type === 'Withdrawal') {
      return {
        title: 'Withdrawal',
        description: 'Funds removed from account',
        icon: ArrowUpFromLine,
        color: 'text-rose-400',
        bg: 'bg-rose-400/8',
        border: 'border-rose-400/15',
      };
    }
    // Transfer — distinguish sent vs received using direction
    if (tx.direction === 'credit') {
      const from = tx.fromAccount || null;
      return {
        title: 'Transfer Received',
        description: from ? `From ${from}` : 'Incoming transfer',
        icon: ArrowDownRight,
        color: 'text-blue-400',
        bg: 'bg-blue-400/8',
        border: 'border-blue-400/15',
      };
    }
    const to = tx.toAccount || null;
    return {
      title: 'Transfer Sent',
      description: to ? `To ${to}` : 'Outgoing transfer',
      icon: ArrowUpRight,
      color: 'text-gold',
      bg: 'bg-gold/8',
      border: 'border-gold/15',
    };
  };

  if (mappedTransactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-text-low">
        <div className="text-2xl mb-3 opacity-30">⛓️</div>
        <p className="text-[11px] font-semibold text-text-mid mb-1">No transactions yet</p>
        <p className="text-[10px] text-text-low text-center max-w-[200px] leading-relaxed">
          Your settlements and activity will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Timeline connector */}
      <div className="absolute left-[18px] top-3 bottom-3 w-px bg-storm-dim/20 pointer-events-none" />

      <div className="space-y-0">
        {mappedTransactions.map((tx, index) => {
          const details = getTxDetails(tx);
          return (
            <motion.div
              key={tx.id}
              className="relative pl-10"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(index * 0.035, 0.25), duration: 0.2, ease: 'easeOut' }}
            >
              {/* Icon node */}
              <div
                className={`absolute left-0.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-xl border flex items-center justify-center ${details.bg} ${details.border} z-10`}
                aria-hidden="true"
              >
                <details.icon size={12} className={details.color} strokeWidth={2} />
              </div>

              {/* Row */}
              <motion.div
                className="flex items-center justify-between cursor-pointer hover:bg-storm-dim/6 rounded-xl py-2.5 px-3 transition-colors duration-150 border border-transparent hover:border-storm-dim/15"
                onClick={() => onTransactionClick?.(tx.transactionId)}
                whileTap={{ scale: 0.997 }}
              >
                <div className="flex-1 min-w-0 pr-3">
                  {/* Title + settlement badge */}
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11.5px] font-semibold text-text-hi truncate">{details.title}</span>
                    {tx.settlement_stage && tx.settlement_stage !== 'DEPOSITED' && (
                      <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-gold/12 text-gold border border-gold/18 animate-pulse flex-shrink-0">
                        <RefreshCw size={6} className="animate-spin-slow" />
                        {tx.settlement_stage.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  {/* Metadata row */}
                  <div className="flex items-center gap-2">
                    <span className="text-[9.5px] text-text-low font-medium truncate max-w-[180px]">
                      {details.description}
                    </span>
                    <span className="text-[9px] text-text-low/60 font-mono hidden sm:inline">
                      {tx.id.slice(0, 8)}
                    </span>
                    <span className="text-[9.5px] text-text-low font-medium ml-auto">
                      {formatRelativeTime(tx.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Amount */}
                {tx.amount !== 0 && (
                  <div
                    className={`font-display font-black text-sm tracking-tight flex-shrink-0 tabular-nums ${tx.direction === 'credit' ? 'text-gold' : 'text-[#c08090]'
                      }`}
                    style={{ letterSpacing: '-0.01em' }}
                  >
                    {tx.direction === 'credit' ? '+' : '−'}{formatCurrencyCompact(tx.amount)}
                  </div>
                )}
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default StormLog;
