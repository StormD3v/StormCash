import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const OverviewHeader = ({ onRefresh, silentRefreshing = false }) => {
  const { user } = useAuth();
  const username = user?.username || 'Storm User';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 flex-shrink-0">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-black text-text-hi tracking-tight" style={{ letterSpacing: '-0.02em' }}>
          Welcome back, {username}
        </h1>
        <p className="text-[10.5px] text-text-low font-medium mt-1 leading-none">
          Here's your financial overview for today.
        </p>
      </div>

      <button
        onClick={onRefresh}
        disabled={silentRefreshing}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-storm-dim/8 hover:bg-storm-dim/15 border border-storm-dim/20 hover:border-storm-dim/30 text-[10px] font-semibold text-text-low hover:text-text-mid transition-all duration-150 tracking-wider uppercase disabled:opacity-40 w-fit focus:outline-none focus-visible:ring-1 focus-visible:ring-gold/40 select-none"
        type="button"
      >
        <RefreshCw
          size={10}
          strokeWidth={2.2}
          className={silentRefreshing ? 'animate-spin-slow' : ''}
        />
        {silentRefreshing ? 'Syncing…' : 'Sync'}
      </button>
    </div>
  );
};

export default OverviewHeader;
