import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpFromLine,
  History,
  Globe,
  Settings,
  ShieldCheck
} from 'lucide-react';

const Sidebar = ({ activePage = 'dashboard', onNavigate, isMobileOpen = false, onCloseMobile }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transfer', label: 'Transfer', icon: ArrowLeftRight },
    { id: 'deposit', label: 'Deposit', icon: ArrowDownLeft },
    { id: 'withdraw', label: 'Withdraw', icon: ArrowUpFromLine },
    { id: 'history', label: 'History', icon: History },
    { id: 'explorer', label: 'Explorer', icon: Globe },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleItemClick = (id) => {
    onNavigate?.(id);
    if (isMobileOpen) onCloseMobile?.();
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between py-5 px-3 bg-panel border-r border-storm-dim/20 select-none">

      {/* Top: Logo + Nav */}
      <div className="space-y-6">

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-2 py-0.5">
          <div className="w-7 h-7 rounded-xl bg-gold/12 flex items-center justify-center border border-gold/25 flex-shrink-0 shadow-gold">
            <span className="font-display text-gold font-black text-sm leading-none">S</span>
          </div>
          <div>
            <h2 className="font-display text-[11px] font-black text-text-hi tracking-widest uppercase leading-none">
              StormCash
            </h2>
            <span className="text-[9px] text-text-low font-semibold tracking-widest uppercase mt-0.5 block">
              Liquidity Engine
            </span>
          </div>
        </div>

        {/* Nav label */}
        <div className="px-2">
          <span className="text-[9px] font-bold text-text-low uppercase tracking-[0.12em]">Navigation</span>
        </div>

        {/* Menu Items */}
        <nav className="-mt-4 space-y-0.5" aria-label="Main Navigation">
          {menuItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[11.5px] font-semibold tracking-wide transition-all duration-150 ease-out focus:outline-none focus-visible:ring-1 focus-visible:ring-gold/40 ${isActive
                    ? 'text-gold bg-gold/8'
                    : 'text-text-mid hover:text-text-hi hover:bg-storm-dim/10'
                  }`}
                type="button"
              >
                {/* Left accent bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-gold" />
                )}
                <item.icon
                  size={13.5}
                  className={isActive ? 'text-gold' : 'text-text-low'}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Trust strip + version */}
      <div className="space-y-4 pt-4 border-t border-storm-dim/15">

        {/* Security micro-card — reduced weight */}
        <div className="rounded-xl p-3 bg-ground/60 border border-storm-dim/12 flex items-start gap-2">
          <ShieldCheck size={12} className="text-gold mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-text-mid block">
              Protected by StormChain
            </span>
            <span className="text-[9px] text-text-low leading-relaxed block mt-0.5">
              Simulated blockchain settlements
            </span>
          </div>
        </div>

        {/* Version + status */}
        <div className="flex items-center justify-between px-1 text-[9px] text-text-low font-medium tracking-wide">
          <span>v0.1.0</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 animate-pulse" />
            <span className="text-text-low">Live</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-[220px] h-screen flex-shrink-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/55 backdrop-blur-sm z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
            />
            <motion.aside
              className="fixed top-0 bottom-0 left-0 w-[220px] z-50 md:hidden shadow-2xl"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
