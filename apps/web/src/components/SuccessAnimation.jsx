import React from 'react';
import { motion } from 'framer-motion';

const SuccessAnimation = ({ onComplete }) => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      onAnimationComplete={onComplete}
    >
      <motion.div
        className="w-16 h-16 rounded-full bg-gold flex items-center justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <motion.svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-ground"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <polyline points="20 6 9 17 4 12" />
        </motion.svg>
      </motion.div>
    </motion.div>
  );
};

export default SuccessAnimation;
