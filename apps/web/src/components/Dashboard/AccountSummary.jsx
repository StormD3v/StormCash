import React from 'react';
import { CreditCard, ArrowRight } from 'lucide-react';

const AccountSummary = ({ accountNumber = '', balance = 0, onDetailsClick }) => {
  const maskedNumber = accountNumber
    ? `•••• •••• •••• ${accountNumber.slice(-4)}`
    : '•••• •••• •••• 6435';

  return (
    <div className="rounded-xl px-4 py-3.5 border border-storm-dim/20 bg-panel/90 backdrop-blur-md shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 flex-shrink-0">

      {/* Account identity */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gold/8 border border-gold/15 flex items-center justify-center text-gold flex-shrink-0">
          <CreditCard size={14} strokeWidth={1.8} />
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-text-hi">Primary Account</span>
            <span className="text-[8.5px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/18 uppercase tracking-wider leading-none">
              Default
            </span>
          </div>
          <span className="font-mono text-[10px] text-text-low tracking-widest">{maskedNumber}</span>
        </div>
      </div>

      {/* Balance + type — horizontal on mobile, vertical on desktop */}
      <div className="flex sm:flex-col gap-x-3 gap-y-0.5 items-baseline sm:items-start border-t sm:border-t-0 pt-3 sm:pt-0 border-storm-dim/15 sm:border-l sm:border-storm-dim/15 sm:pl-5">
        <span className="text-[9.5px] font-medium text-text-low uppercase tracking-wider">Checking · USD</span>
        <span className="text-sm font-bold text-text-hi tabular-nums">
          ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* CTA */}
      <button
        onClick={onDetailsClick}
        className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-storm-dim/6 hover:bg-storm-dim/14 border border-storm-dim/22 text-[10.5px] font-semibold text-text-mid hover:text-text-hi transition-all duration-150 w-full sm:w-auto focus:outline-none focus-visible:ring-1 focus-visible:ring-gold/40 flex-shrink-0"
        type="button"
      >
        <span>Details</span>
        <ArrowRight size={11} strokeWidth={2} />
      </button>
    </div>
  );
};

export default AccountSummary;
