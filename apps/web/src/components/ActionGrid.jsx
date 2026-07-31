import React from 'react';
import { motion } from 'framer-motion';

const ActionGrid = ({ onAction }) => {
  const actions = [
    { id: 'transfer', label: 'Transfer', icon: '→' },
    { id: 'deposit', label: 'Deposit', icon: '↓' },
    { id: 'withdraw', label: 'Withdraw', icon: '↑' },
    { id: 'history', label: 'History', icon: '≡' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {actions.map((action) => (
        <motion.button
          key={action.id}
          className="rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:-translate-y-1 transition-transform duration-200"
          style={{ backgroundColor: '#191d26', border: '1px solid #4a5568' }}
          onClick={() => onAction?.(action.id)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="text-2xl" style={{ color: '#96958f' }}>{action.icon}</span>
          <span className="text-sm font-medium" style={{ color: '#ece9e0' }}>{action.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default ActionGrid;