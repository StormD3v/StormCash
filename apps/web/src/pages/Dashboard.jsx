import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import Sky from '../components/Sky';
import DashboardLayout from '../components/Dashboard/DashboardLayout';
import OverviewHeader from '../components/Dashboard/OverviewHeader';
import KPIGrid from '../components/Dashboard/KPIGrid';
import BalanceHero from '../components/Dashboard/BalanceHero';
import AccountSummary from '../components/Dashboard/AccountSummary';
import QuickActions from '../components/Dashboard/QuickActions';
import RecentActivity from '../components/Dashboard/RecentActivity';
import SecondaryContent from '../components/Dashboard/SecondaryContent';
import TransferModal from '../components/TransferModal';
import TransactionExplorer from '../components/TransactionExplorer';
import DepositWithdrawModal from '../components/DepositWithdrawModal';
import { TransactionSkeleton } from '../components/SkeletonLoader';
import { fastAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isNewUser = new URLSearchParams(location.search).get('welcome') === '1';
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(isNewUser);
  const [balance, setBalance] = useState(0);
  const [trend, setTrend] = useState('stable');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [silentRefreshing, setSilentRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Mobile KPIs expand state
  const [showMobileKPIs, setShowMobileKPIs] = useState(false);

  // Modals state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showTransactionExplorer, setShowTransactionExplorer] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);
  const [showDepositWithdrawModal, setShowDepositWithdrawModal] = useState(false);
  const [modalAction, setModalAction] = useState('deposit');

  const accountNumber = user?.accounts?.[0]?.account_number || '';

  const activityRef = useRef(null);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!accountNumber) return;

    if (isSilent) {
      setSilentRefreshing(true);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      const balanceData = await fastAPI.getBalance(accountNumber);
      const newBalance = parseFloat(balanceData.balance);
      setBalance(newBalance);

      const historyData = await fastAPI.getHistory(accountNumber);
      const txs = historyData.transactions || [];
      setTransactions(txs);

      if (txs.length > 0 && newBalance > 0) {
        const lastTx = txs[0];
        // transaction_type is uppercase from the API
        setTrend(lastTx.transaction_type?.toUpperCase() === 'DEPOSIT' ? 'rising' : 'stable');
      } else {
        setTrend('stable');
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      if (!isSilent) {
        setError('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
      setSilentRefreshing(false);
    }
  }, [accountNumber]);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  // Business Logic Selectors
  const stats = useMemo(() => {
    // transaction_type comes from the API as uppercase ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER')
    const depositTxs = transactions.filter(tx => tx.transaction_type?.toUpperCase() === 'DEPOSIT');
    const withdrawalTxs = transactions.filter(tx => tx.transaction_type?.toUpperCase() === 'WITHDRAWAL');

    const totalDeposits = depositTxs.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
    const totalWithdrawals = withdrawalTxs.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

    return {
      totalDeposits,
      totalWithdrawals,
      depositsCount: depositTxs.length,
      withdrawalsCount: withdrawalTxs.length
    };
  }, [transactions]);

  // Compact Mobile KPI cards renderer
  const compactKpis = useMemo(() => {
    const items = [
      { id: 'available', title: 'Available Balance', value: balance, label: 'Ready to spend' },
      { id: 'deposits', title: 'Total Deposits', value: stats.totalDeposits, label: `${stats.depositsCount} deposit${stats.depositsCount === 1 ? '' : 's'}` },
      { id: 'withdrawals', title: 'Total Withdrawals', value: stats.totalWithdrawals, label: `${stats.withdrawalsCount} withdrawal${stats.withdrawalsCount === 1 ? '' : 's'}` },
    ];
    return items.map(kpi => (
      <div key={kpi.id} className="flex justify-between items-center p-3 rounded-xl bg-ground/50 border border-storm-dim/15">
        <div>
          <span className="text-[9.5px] font-semibold uppercase tracking-wider text-text-low block">{kpi.title}</span>
          <span className="text-[9px] text-text-low/70 font-medium uppercase tracking-wider mt-0.5 block">{kpi.label}</span>
        </div>
        <span className="font-display font-black text-text-hi tabular-nums" style={{ fontSize: '1rem', letterSpacing: '-0.015em' }}>
          ${kpi.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    ));
  }, [balance, stats]);

  // Modal Actions
  const handleAction = useCallback((actionId) => {
    if (actionId === 'deposit' || actionId === 'withdraw') {
      setModalAction(actionId);
      setShowDepositWithdrawModal(true);
    }
  }, []);

  const handleTransfer = useCallback(() => {
    setShowTransferModal(true);
  }, []);

  const handleOperationComplete = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  const handleTransactionClick = useCallback((transactionId) => {
    setSelectedTransactionId(transactionId);
    setShowTransactionExplorer(true);
  }, []);

  // Navigation actions
  const handleNavigate = useCallback((pageId) => {
    if (pageId === 'transfer') {
      setShowTransferModal(true);
    } else if (pageId === 'deposit') {
      setModalAction('deposit');
      setShowDepositWithdrawModal(true);
    } else if (pageId === 'withdraw') {
      setModalAction('withdraw');
      setShowDepositWithdrawModal(true);
    } else if (pageId === 'history' || pageId === 'dashboard') {
      activityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (pageId === 'explorer') {
      setSelectedTransactionId(null);
      setShowTransactionExplorer(true);
    } else if (pageId === 'settings') {
      // Settings panel — no-op for now, sidebar item stays for future use
    }
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* Background Starfield Sky Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Sky trend={trend} height="100%" />
      </div>

      {/* Main Full-Screen Layout wrapper */}
      <DashboardLayout
        activePage="dashboard"
        onNavigate={handleNavigate}
        silentRefreshing={silentRefreshing}
      >
        {/* Skeleton loading display */}
        {loading ? (
          <div className="py-8">
            <TransactionSkeleton />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center rounded-2xl border border-storm-dim/30 bg-panel/95 backdrop-blur-md">
            <p className="text-sm text-storm font-semibold">{error}</p>
            <button
              onClick={() => fetchData(false)}
              className="px-4 py-2 rounded-lg bg-storm-dim/20 hover:bg-storm-dim/30 text-xs font-bold text-text-hi border border-storm-dim/30 transition-all uppercase tracking-wider"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            {/* ── Welcome banner (shown on first login after registration) ── */}
            <AnimatePresence>
              {showWelcomeBanner && accountNumber && (
                <motion.div
                  className="rounded-xl border border-gold/25 bg-gold/8 px-4 py-3.5 flex items-center justify-between gap-4 flex-shrink-0"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-gold uppercase tracking-wider mb-0.5">
                      Account created
                    </p>
                    <p className="text-[10.5px] text-text-mid">
                      Your account number is{' '}
                      <span className="font-mono text-text-hi tracking-widest select-all">{accountNumber}</span>
                      {' '}— share it so others can send you transfers.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowWelcomeBanner(false)}
                    className="text-text-low hover:text-text-mid transition-colors flex-shrink-0 text-xs font-semibold uppercase tracking-wider"
                    type="button"
                  >
                    Dismiss
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 🖥️ Desktop layout (Visible on md breakpoint and above) */}
            <div className="hidden md:block space-y-5">
              {/* Overview Header / Greetings */}
              <OverviewHeader
                onRefresh={() => fetchData(true)}
                silentRefreshing={silentRefreshing}
              />

              {/* KPI Metrics row (with 5-column layout) */}
              <KPIGrid
                balance={balance}
                trend={trend}
                accountNumber={accountNumber}
                totalDeposits={stats.totalDeposits}
                totalWithdrawals={stats.totalWithdrawals}
                depositsCount={stats.depositsCount}
                withdrawalsCount={stats.withdrawalsCount}
              />

              {/* Account details card */}
              <AccountSummary
                accountNumber={accountNumber}
                balance={balance}
                onDetailsClick={() => {
                  // Scroll to activity section when details clicked
                  activityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              />

              {/* Quick Actions Shortcuts row */}
              <QuickActions
                onAction={handleAction}
                onTransfer={handleTransfer}
              />

              {/* Split layout block: timeline on left, insights on right */}
              <div ref={activityRef} className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                <div className="lg:col-span-2">
                  <RecentActivity
                    transactions={transactions}
                    onTransactionClick={handleTransactionClick}
                    onViewAll={() => handleNavigate('history')}
                  />
                </div>

                <div className="lg:col-span-1">
                  <SecondaryContent
                    transactions={transactions}
                  />
                </div>

              </div>
            </div>

            {/* 📱 Mobile Layout (Visible on viewports below md breakpoint) */}
            <div className="block md:hidden space-y-5 pb-16">
              {/* Balance Hero Centerpiece */}
              <BalanceHero
                balance={balance}
                trend={trend}
                accountNumber={accountNumber}
                isMobile
              />

              {/* Collapsed Secondary KPI statistics drawer */}
              <div className="border border-storm-dim/20 rounded-xl bg-panel/90 backdrop-blur-md overflow-hidden shadow-card">
                <button
                  onClick={() => setShowMobileKPIs(!showMobileKPIs)}
                  className="w-full py-3 px-4 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-text-low hover:text-text-mid transition-colors focus:outline-none"
                  type="button"
                >
                  <span>{showMobileKPIs ? 'Hide Statistics' : 'Account Statistics'}</span>
                  <span className="text-[8px] transition-transform duration-200" style={{ transform: showMobileKPIs ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    ▼
                  </span>
                </button>
                {showMobileKPIs && (
                  <div className="p-3 border-t border-storm-dim/15 grid grid-cols-1 gap-2 bg-ground/30">
                    {compactKpis}
                  </div>
                )}
              </div>

              {/* Quick Actions grid shortcuts */}
              <QuickActions
                onAction={handleAction}
                onTransfer={handleTransfer}
              />

              {/* Recent Activity segment log */}
              <div ref={activityRef}>
                <RecentActivity
                  transactions={transactions}
                  onTransactionClick={handleTransactionClick}
                  onViewAll={() => handleNavigate('history')}
                />
              </div>
            </div>
          </>
        )}
      </DashboardLayout>

      {/* ── Modals ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showTransferModal && (
          <TransferModal
            isOpen={showTransferModal}
            onClose={() => setShowTransferModal(false)}
            fromAccount={accountNumber}
            onTransferComplete={handleOperationComplete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDepositWithdrawModal && (
          <DepositWithdrawModal
            isOpen={showDepositWithdrawModal}
            onClose={() => setShowDepositWithdrawModal(false)}
            action={modalAction}
            accountNumber={accountNumber}
            currentBalance={balance}
            onComplete={handleOperationComplete}
          />
        )}
      </AnimatePresence>

      {/* Transaction Explorer Modal */}
      <AnimatePresence>
        {showTransactionExplorer && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowTransactionExplorer(false); }}
          >
            <motion.div
              className="w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl border bg-panel border-storm-dim/40 shadow-card overflow-hidden"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            >
              <div className="p-6" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
                <TransactionExplorer
                  transactionId={selectedTransactionId}
                  onClose={() => setShowTransactionExplorer(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
