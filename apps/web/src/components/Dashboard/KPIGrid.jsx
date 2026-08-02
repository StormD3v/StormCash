import React from 'react';
import { Wallet, ArrowDown, ArrowUp } from 'lucide-react';
import BalanceHero from './BalanceHero';

const KPIGrid = ({
  balance = 0,
  trend = 'stable',
  accountNumber = '',
  totalDeposits = 0,
  totalWithdrawals = 0,
  depositsCount = 0,
  withdrawalsCount = 0
}) => {

  const kpis = [
    {
      id: 'available',
      title: 'Available',
      value: balance,
      subtitle: 'Ready to spend',
      badge: '100% Liquid',
      badgeColor: 'text-emerald-400 bg-emerald-400/8 border-emerald-400/15',
      icon: Wallet,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-400/8 border-emerald-400/12',
      accentHover: 'hover:border-emerald-400/25',
    },
    {
      id: 'deposits',
      title: 'Deposits',
      value: totalDeposits,
      subtitle: `${depositsCount} transaction${depositsCount === 1 ? '' : 's'}`,
      badge: 'All time',
      badgeColor: 'text-gold/80 bg-gold/8 border-gold/15',
      icon: ArrowDown,
      iconColor: 'text-gold',
      iconBg: 'bg-gold/8 border-gold/12',
      accentHover: 'hover:border-gold/25',
    },
    {
      id: 'withdrawals',
      title: 'Withdrawals',
      value: totalWithdrawals,
      subtitle: `${withdrawalsCount} transaction${withdrawalsCount === 1 ? '' : 's'}`,
      badge: 'All time',
      badgeColor: 'text-text-low bg-storm-dim/8 border-storm-dim/15',
      icon: ArrowUp,
      iconColor: 'text-rose-400',
      iconBg: 'bg-rose-400/8 border-rose-400/12',
      accentHover: 'hover:border-storm-dim/35',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 flex-shrink-0">
      {/* BalanceHero spans 2 of 5 columns */}
      <BalanceHero balance={balance} trend={trend} accountNumber={accountNumber} />

      {/* KPI cards — 1 column each */}
      {kpis.map((kpi) => (
        <div
          key={kpi.id}
          className={`rounded-2xl p-5 border border-storm-dim/20 ${kpi.accentHover} bg-panel/95 flex flex-col justify-between shadow-card hover:shadow-card-raised transition-all duration-200 ease-out-expo group`}
        >
          {/* Header: title + icon */}
          <div className="flex items-start justify-between gap-2 mb-4">
            <span className="text-[10px] font-semibold text-text-low uppercase tracking-[0.1em] leading-tight mt-0.5">
              {kpi.title}
            </span>
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center border flex-shrink-0 ${kpi.iconBg} transition-transform duration-200 group-hover:scale-110`}>
              <kpi.icon size={12.5} className={kpi.iconColor} strokeWidth={2} />
            </div>
          </div>

          {/* Value */}
          <div className="mb-3">
            <h3 className="font-display font-black text-text-hi tracking-tight" style={{ fontSize: '1.5rem', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {formatCurrencyCompact(kpi.value)}
            </h3>
          </div>

          {/* Footer: subtitle + badge */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-text-low font-medium leading-none truncate">
              {kpi.subtitle}
            </span>
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md border flex-shrink-0 leading-none ${kpi.badgeColor}`}>
              {kpi.badge}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPIGrid;
