import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, ArrowUpFromLine, History } from 'lucide-react';

const ActionGrid = ({ onAction, onTransfer }) => {
  const actions = [
    { id: 'transfer', label: 'Transfer', icon: ArrowUpRight, color: 'text-[#d9a35c]', bg: 'bg-[#d9a35c]/8' },
    { id: 'deposit', label: 'Deposit', icon: ArrowDownLeft, color: 'text-emerald-400', bg: 'bg-emerald-400/8' },
    { id: 'withdraw', label: 'Withdraw', icon: ArrowUpFromLine, color: 'text-rose-400', bg: 'bg-rose-400/8' },
    { id: 'history', label: 'History', icon: History, color: 'text-blue-400', bg: 'bg-blue-400/8' },
  ];

  const handleClick = (actionId) => {
    if (actionId === 'transfer' && onTransfer) {
      onTransfer();
    } else {
      onAction?.(actionId);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {actions.map((action) => (
        <motion.button
          key={action.id}
          className="rounded-xl py-3 px-4 flex flex-col items-center justify-center gap-1.5 border border-storm-dim/40 bg-storm-dim/5 hover:bg-storm-dim/10 hover:border-storm/30 transition-all duration-200 ease-out-expo shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
          onClick={() => handleClick(action.id)}
          whileHover={{ scale: 1.015, y: -0.5 }}
          whileTap={{ scale: 0.985 }}
          type="button"
        >
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${action.bg} mb-0.5 transition-colors`}>
            <action.icon size={16} className={action.color} aria-hidden="true" />
          </div>
          <span className="text-[11px] font-semibold text-text-hi tracking-wide">{action.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default ActionGrid;
