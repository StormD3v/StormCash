import React from 'react';

// ─── Base shimmer block ──────────────────────────────────────────────────────
const Shimmer = ({ className = '' }) => (
  <div
    className={`skeleton-shimmer rounded-lg ${className}`}
    aria-hidden="true"
  />
);

// ─── Default export for single-use cases ────────────────────────────────────
const SkeletonLoader = ({ className = '', height = 'h-4', width = 'w-full' }) => (
  <Shimmer className={`${height} ${width} ${className}`} />
);

// ─── Full dashboard skeleton — matches actual Dashboard layout ────────────────
export const DashboardSkeleton = () => (
  <div
    className="space-y-8"
    role="status"
    aria-busy="true"
    aria-label="Loading dashboard"
  >
    {/* Account meta + balance */}
    <div className="space-y-3">
      <Shimmer className="h-3 w-32" />
      <div className="flex items-end gap-3">
        <Shimmer className="h-10 w-6 rounded" />
        <Shimmer className="h-12 w-52 rounded" />
        <Shimmer className="h-5 w-16 rounded-full" />
      </div>
      {/* Trace chart */}
      <Shimmer className="h-14 w-full mt-2 rounded-lg" />
    </div>

    {/* Divider */}
    <div className="h-px bg-storm-dim/40" />

    {/* Action grid — 4 columns */}
    <div className="grid grid-cols-4 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <Shimmer key={i} className="h-[88px] rounded-xl" />
      ))}
    </div>

    {/* Divider */}
    <div className="h-px bg-storm-dim/40" />

    {/* Transaction list */}
    <div className="space-y-1">
      {/* Section label */}
      <Shimmer className="h-3 w-28 mb-5" />

      {/* Transaction rows */}
      {[1, 0.75, 0.9, 0.6, 0.8].map((w, i) => (
        <div key={i} className="relative flex items-center gap-3 pl-11 py-3.5">
          {/* Node dot placeholder */}
          <div className="absolute left-[11px] w-5 h-5 rounded-full skeleton-shimmer" />
          <div className="flex-1 space-y-1.5">
            <Shimmer className="h-3.5" style={{ width: `${w * 40}%` }} />
            <Shimmer className="h-2.5" style={{ width: `${w * 25}%` }} />
          </div>
          <Shimmer className="h-4 w-16 rounded flex-shrink-0" />
        </div>
      ))}
    </div>
  </div>
);

// ─── Minimal transaction-only skeleton (used for sub-section refresh) ────────
export const TransactionSkeleton = () => (
  <div
    className="space-y-0.5"
    role="status"
    aria-busy="true"
    aria-label="Loading transactions"
  >
    {[1, 0.7, 0.85, 0.6, 0.9].map((w, i) => (
      <div key={i} className="flex items-center gap-3 pl-11 py-3.5">
        <div className="flex-1 space-y-1.5">
          <Shimmer className="h-3.5" style={{ width: `${w * 40}%` }} />
          <Shimmer className="h-2.5" style={{ width: `${w * 25}%` }} />
        </div>
        <Shimmer className="h-4 w-16 flex-shrink-0" />
      </div>
    ))}
  </div>
);

export default SkeletonLoader;
