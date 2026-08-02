import React, { useState } from 'react';
import { LayoutDashboard, ArrowLeftRight, ArrowDownLeft, ArrowUpFromLine, History } from 'lucide-react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

const DashboardLayout = ({ activePage = 'dashboard', onNavigate, children, silentRefreshing = false }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const mobileNavItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'transfer', label: 'Transfer', icon: ArrowLeftRight },
    { id: 'deposit', label: 'Deposit', icon: ArrowDownLeft },
    { id: 'withdraw', label: 'Withdraw', icon: ArrowUpFromLine },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <div className="h-screen w-screen flex bg-transparent text-text-hi overflow-hidden relative select-none">

      {/* Persistent left sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main content column */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">

        <TopNavbar
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          silentRefreshing={silentRefreshing}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 xl:p-8 space-y-5 relative pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-panel/96 backdrop-blur-xl border-t border-storm-dim/20 flex items-stretch justify-around z-30"
        style={{ height: '56px' }}
        aria-label="Mobile navigation"
      >
        {mobileNavItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate?.(item.id)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 transition-colors duration-150 min-w-0 px-1 ${isActive ? 'text-gold' : 'text-text-low hover:text-text-mid'
                }`}
              type="button"
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon
                size={17}
                strokeWidth={isActive ? 2.2 : 1.7}
                className={isActive ? 'text-gold' : 'text-text-low'}
              />
              <span className="text-[9.5px] font-semibold uppercase tracking-wide leading-none">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default DashboardLayout;
