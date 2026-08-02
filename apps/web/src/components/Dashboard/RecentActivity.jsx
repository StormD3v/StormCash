import React from 'react';
import StormLog from '../StormLog';

const RecentActivity = ({ transactions = [], onTransactionClick, onViewAll }) => {
  return (
    <div className="rounded-2xl border border-storm-dim/20 bg-panel/95 backdrop-blur-md shadow-card flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3.5 border-b border-storm-dim/15">
        <div>
          <h2 className="text-[11px] font-semibold text-text-hi uppercase tracking-[0.1em]">
            Recent Activity
          </h2>
          <p className="text-[9.5px] text-text-low font-medium mt-0.5">
            {transactions.length > 0 ? `${transactions.length} transaction${transactions.length === 1 ? '' : 's'}` : 'No transactions yet'}
          </p>
        </div>
        <button
          onClick={onViewAll}
          className="text-[10px] font-semibold text-gold/80 hover:text-gold transition-colors focus:outline-none uppercase tracking-wider"
          type="button"
        >
          View all
        </button>
      </div>

      {/* Scrollable log */}
      <div
        className="flex-1 overflow-y-auto px-3 py-2"
        style={{ scrollbarWidth: 'thin', minHeight: '220px', maxHeight: '360px' }}
      >
        <StormLog
          transactions={transactions}
          onTransactionClick={onTransactionClick}
        />
      </div>
    </div>
  );
};

export default RecentActivity;
