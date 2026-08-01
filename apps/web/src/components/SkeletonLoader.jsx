import React from 'react';
import { motion } from 'framer-motion';

const SkeletonLoader = ({ className = '', height = 'h-4', width = 'w-full' }) => (
  <motion.div
    className={`bg-storm-dim rounded ${className} ${height} ${width}`}
    initial={{ opacity: 0.5 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
  />
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <SkeletonLoader height="h-16" width="w-3/4" />
    <SkeletonLoader height="h-32" />
    <div className="grid grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <SkeletonLoader key={i} height="h-20" />
      ))}
    </div>
    <SkeletonLoader height="h-48" />
  </div>
);

export const TransactionSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center gap-4">
        <SkeletonLoader height="h-4" width="w-4" className="rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonLoader height="h-4" width="w-1/3" />
          <SkeletonLoader height="h-3" width="w-1/4" />
        </div>
        <SkeletonLoader height="h-4" width="w-16" />
      </div>
    ))}
  </div>
);

export default SkeletonLoader;
