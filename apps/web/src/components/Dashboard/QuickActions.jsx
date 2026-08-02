import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, ArrowDownLeft, ArrowUpFromLine, History } from 'lucide-react';

const QuickActions = ({ onAction, onTransfer }) => {
  const actions = [
    {
      id: 'transfer',
      label: 'Transfer',
      description: 'Send money',
      icon: ArrowLeftRight,
      color: 'text-gold',
      bg: 'bg-gold/8',
      border: 'border-gold/15',
      hoverBorder: 'hover:border-gold/30',
    },
    {
      id: 'deposit',
      label: 'Deposit',
      description: 'Add funds',
      icon: ArrowDownLeft,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/8',
      border: 'border-emerald-400/15',
      hoverBorder: 'hover:border-emerald-400/30',
    },
    {
      id: 'withdraw',
      label: 'Withdraw',
      description: 'Cash out',
      icon: ArrowUpFromLine,
      color: 'text-rose-400',
      bg: 'bg-rose-400/8',
      border: 'border-rose-400/15',
      hoverBorder: 'hover:border-rose-400/30',
    },
    {
      id: 'history',
      label: 'History',
      description: 'View ledger',
      icon: History,
      color: 'text-blue-400',
      bg: 'bg-blue-400/8',
      border: 'border-blue-400/15',
      hoverBorder: 'hover:border-blue-400/30',
    },
  ];

  const handleClick = (actionId) => {
    if (actionId === 'transfer' && onTransfer) onTransfer();
    else onAction?.(actionId);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-shrink-0">
      {actions.map((action) => (
        <motion.button
          key={action.id}
          className={`rounded-xl p-4 flex items-center gap-3 border border-storm-dim/20 ${action.hoverBorder} bg-panel/95 hover:bg-panel text-left transition-colors duration-150 shadow-card hover:shadow-card-raised focus:outline-none focus-visible:ring-1 focus-visible:ring-gold/40 group`}
          onClick={() => handleClick(action.id)}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.975 }}
          type="button"
        >
          {/* Icon */}
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${action.bg} ${action.border} transition-transform duration-150 group-hover:scale-105`}>
            <action.icon size={15} className={action.color} strokeWidth={1.9} aria-hidden="true" />
          </div>

          {/* Label */}
          <div className="min-w-0">
            <span className="text-[11.5px] font-semibold text-text-hi block leading-none">
              {action.label}
            </span>
            <span className="text-[10px] text-text-low font-medium block mt-1.5 leading-none">
              {action.description}
            </span>
          </div>
        </motion.button>
      ))}
    </div>
  );
};

export default QuickActions;
