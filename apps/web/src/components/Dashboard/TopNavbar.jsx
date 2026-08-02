import React from 'react';
import { Menu, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const TopNavbar = ({ onOpenMobileSidebar, silentRefreshing = false }) => {
  const { user, logout } = useAuth();
  const username = user?.username || 'Storm User';

  return (
    <header className="h-12 border-b border-storm-dim/20 bg-panel/70 backdrop-blur-md flex items-center justify-between px-5 z-20 flex-shrink-0">

      {/* Left: mobile trigger + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="p-1.5 rounded-lg hover:bg-storm-dim/12 text-text-mid hover:text-text-hi md:hidden transition-colors focus:outline-none"
          aria-label="Open navigation menu"
          type="button"
        >
          <Menu size={16} strokeWidth={1.8} />
        </button>

        <div className="hidden md:flex items-center gap-2">
          <span className="text-[10px] font-semibold text-text-low uppercase tracking-[0.12em]">
            Dashboard
          </span>
          <span className="text-[10px] text-text-low/40">/</span>
          <span className="text-[10px] font-semibold text-text-mid uppercase tracking-[0.12em]">
            Overview
          </span>
        </div>
      </div>

      {/* Right: sync indicator + bell + user + logout */}
      <div className="flex items-center gap-3.5">

        {/* Live sync dot */}
        <div className="hidden sm:flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${silentRefreshing ? 'bg-gold animate-pulse' : 'bg-emerald-400/70'}`} />
          <span className="text-[9.5px] font-medium text-text-low uppercase tracking-wider">
            {silentRefreshing ? 'Syncing' : 'Live'}
          </span>
        </div>

        <div className="hidden sm:block w-px h-4 bg-storm-dim/20" />

        {/* Notifications */}
        <button
          className="relative p-1.5 rounded-lg hover:bg-storm-dim/10 text-text-low hover:text-text-mid transition-colors focus:outline-none"
          aria-label="View notifications"
          type="button"
        >
          <Bell size={14} strokeWidth={1.8} />
          <span className="absolute top-1.5 right-1.5 w-1 h-1 bg-gold rounded-full" />
        </button>

        <div className="w-px h-4 bg-storm-dim/20" />

        {/* User chip */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-storm-dim/25 border border-storm-dim/30 flex items-center justify-center flex-shrink-0">
            <User size={11} strokeWidth={1.8} className="text-text-mid" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-[11px] font-semibold text-text-hi leading-none truncate max-w-[96px]">
              {username}
            </p>
            <span className="text-[9px] text-text-low font-medium tracking-wide mt-0.5 block">
              Active
            </span>
          </div>
        </div>

        <div className="w-px h-4 bg-storm-dim/20" />

        {/* Logout */}
        <button
          onClick={logout}
          className="p-1.5 rounded-lg hover:bg-storm-dim/10 text-text-low hover:text-rose-400 transition-colors focus:outline-none"
          aria-label="Sign out"
          title="Sign out"
          type="button"
        >
          <LogOut size={13} strokeWidth={1.8} />
        </button>

      </div>
    </header>
  );
};

export default TopNavbar;
