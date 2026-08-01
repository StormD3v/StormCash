import React from 'react';
import { motion } from 'framer-motion';

const ActionGrid = ({ onAction, onTransfer }) => {
  const actions = [
    { id: 'transfer', label: 'Transfer', icon: '↗', color: '#d9a35c' },
    { id: 'deposit', label: 'Deposit', icon: '↓', color: '#4ade80' },
    { id: 'withdraw', label: 'Withdraw', icon: '↑', color: '#f87171' },
    { id: 'history', label: 'History', icon: '≡', color: '#60a5fa' },
  ];

  const handleClick = (actionId) => {
    if (actionId === 'transfer' && onTransfer) {
      onTransfer();
    } else {
      onAction?.(actionId);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {actions.map((action) => (
        <motion.button
          key={action.id}
          className="rounded-xl p-5 flex flex-col items-center justify-center gap-3 border border-storm-dim bg-storm-dim/10 hover:bg-storm-dim/20 transition-all duration-200 shadow-sm hover:shadow-md"
          onClick={() => handleClick(action.id)}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="text-2xl" style={{ color: action.color }}>{action.icon}</span>
          <span className="text-sm font-medium text-text-hi">{action.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default ActionGrid;