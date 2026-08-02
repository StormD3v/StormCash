import React from 'react';
import { Shield, Activity, Coins } from 'lucide-react';

const SecondaryContent = ({ transactions = [] }) => {
  const pendingTxs = transactions.filter(
    tx => tx.settlement_stage && tx.settlement_stage !== 'DEPOSITED'
  );
  const pendingCount = pendingTxs.length;

  const insights = [
    {
      id: 'settlements',
      icon: Activity,
      iconColor: 'text-gold',
      iconBg: 'bg-gold/8 border-gold/12',
      label: 'Settlements',
      value: pendingCount > 0
        ? `${pendingCount} in progress`
        : 'All settled',
      valueColor: pendingCount > 0 ? 'text-gold' : 'text-emerald-400',
      pulse: pendingCount > 0,
    },
    {
      id: 'integrity',
      icon: Shield,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-400/8 border-emerald-400/12',
      label: 'Ledger Integrity',
      value: '100% OK',
      valueColor: 'text-emerald-400',
      pulse: false,
    },
    {
      id: 'gas',
      icon: Coins,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-400/8 border-blue-400/12',
      label: 'Avg. Gas Cost',
      value: '$0.50',
      valueColor: 'text-text-mid',
      pulse: false,
    },
  ];

  return (
    <div className="rounded-2xl border border-storm-dim/20 bg-panel/95 backdrop-blur-md shadow-card flex flex-col h-full">

      {/* Header */}
      <div className="px-5 pt-5 pb-3.5 border-b border-storm-dim/15">
        <h2 className="text-[11px] font-semibold text-text-hi uppercase tracking-[0.1em]">
          Ledger Insights
        </h2>
        <p className="text-[9.5px] text-text-low font-medium mt-0.5">
          StormChain status
        </p>
      </div>

      {/* Insight rows */}
      <div className="flex-1 flex flex-col justify-center px-4 py-4 gap-0">
        {insights.map((item, idx) => (
          <div key={item.id}>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center border flex-shrink-0 ${item.iconBg}`}>
                  <item.icon size={12.5} className={item.iconColor} strokeWidth={1.9} />
                </div>
                <div>
                  <span className="text-[10.5px] font-semibold text-text-hi block leading-none">
                    {item.label}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {item.pulse && (
                  <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                )}
                <span className={`text-[10.5px] font-semibold tabular-nums ${item.valueColor}`}>
                  {item.value}
                </span>
              </div>
            </div>
            {idx < insights.length - 1 && (
              <div className="h-px bg-storm-dim/10 mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Explorer note */}
      <div className="px-4 pb-4">
        <p className="text-center text-[9px] text-text-low/50 leading-relaxed">
          Settlement data is simulated via StormChain
        </p>
      </div>
    </div>
  );
};

export default SecondaryContent;
