import React, { useState, useEffect, useCallback, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowDownLeft, ArrowUpFromLine, Loader2, Lock } from 'lucide-react';
import SuccessAnimation from './SuccessAnimation';
import { fastAPI } from '../services/api';
import { formatCurrencyCompact } from '../lib/currency';

// ─── Animation presets ────────────────────────────────────────────────────────
const BACKDROP_ANIM = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

const PANEL_ANIM = {
  initial: { opacity: 0, scale: 0.96, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 10 },
  transition: { type: 'spring', stiffness: 320, damping: 32 },
};

// ─── Shared sub-components ────────────────────────────────────────────────────

const FieldLabel = ({ htmlFor, children }) => (
  <label
    htmlFor={htmlFor}
    className="block text-[11px] font-semibold uppercase tracking-wider text-text-mid mb-1.5"
  >
    {children}
  </label>
);

const ReadonlyField = ({ id, value }) => (
  <div
    id={id}
    className="flex items-center justify-between px-4 py-3 rounded-lg bg-ground/60 border border-storm-dim/60"
    aria-readonly="true"
  >
    <span className="font-mono text-sm text-text-hi truncate">{value}</span>
    <Lock size={12} className="text-text-low flex-shrink-0 ml-2" aria-hidden="true" />
  </div>
);

const ErrorMessage = ({ message }) => (
  <motion.div
    role="alert"
    className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-[#c08090]/10 border border-[#c08090]/25 text-[#c08090] text-sm"
    initial={{ opacity: 0, y: -6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2 }}
  >
    <span className="flex-shrink-0 mt-0.5" aria-hidden="true">⚠</span>
    {message}
  </motion.div>
);

// ─── DepositWithdrawModal ────────────────────────────────────────────────────

const DepositWithdrawModal = ({
  isOpen,
  onClose,
  action,
  accountNumber,
  currentBalance,
  onComplete,
}) => {
  const [step, setStep] = useState('input');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isDeposit = action === 'deposit';

  const titleId = useId();
  const amountId = useId();
  const acctId = useId();
  const balanceId = useId();

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    setStep('input');
    setAmount('');
    setError(null);
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (loading) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }
    if (!isDeposit && parsedAmount > currentBalance) {
      setError(`Insufficient funds. Available: ${formatCurrencyCompact(currentBalance)}`);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      if (isDeposit) {
        await fastAPI.deposit(accountNumber, parsedAmount);
      } else {
        await fastAPI.withdraw(accountNumber, parsedAmount);
      }
      setStep('complete');
      onComplete?.();
    } catch (err) {
      setError(err.message || `${isDeposit ? 'Deposit' : 'Withdrawal'} failed. Please try again.`);
    } finally {
      setLoading(false);
    }
  }, [loading, amount, isDeposit, currentBalance, accountNumber, onComplete]);

  // ── Escape key ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, loading, handleClose]);

  // ── Prevent background scroll ────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  // Per-action theming
  const ActionIcon = isDeposit ? ArrowDownLeft : ArrowUpFromLine;
  const iconColor = isDeposit ? 'text-[#7dc9a0]' : 'text-[#c08090]';
  const iconBg = isDeposit ? 'bg-[#7dc9a0]/10' : 'bg-[#c08090]/10';
  const btnClass = isDeposit
    ? 'bg-gold text-ground hover:bg-gold-dim'
    : 'bg-gold/80 text-ground hover:bg-gold';
  const summaryBg = isDeposit ? 'bg-[#7dc9a0]/8 border-[#7dc9a0]/20' : 'bg-[#c08090]/8 border-[#c08090]/20';
  const summaryColor = isDeposit ? 'text-[#7dc9a0]' : 'text-[#c08090]';

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
        onClick={(e) => { if (!loading && e.target === e.currentTarget) handleClose(); }}
        {...BACKDROP_ANIM}
      >
        {/* Panel */}
        <motion.div
          className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border bg-panel border-storm-dim shadow-card shadow-inset-top overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={(e) => e.stopPropagation()}
          {...PANEL_ANIM}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconBg}`} aria-hidden="true">
                  <ActionIcon size={14} className={iconColor} />
                </div>
                <h2
                  id={titleId}
                  className="font-display text-lg font-semibold text-text-hi"
                >
                  {isDeposit ? 'Deposit Funds' : 'Withdraw Funds'}
                </h2>
              </div>
              <button
                onClick={handleClose}
                disabled={loading}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-text-mid hover:text-text-hi hover:bg-storm-dim/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
                aria-label={`Close ${isDeposit ? 'deposit' : 'withdraw'} modal`}
                type="button"
              >
                <X size={14} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>

            {/* ── Input Step ─────────────────────────────────────────────── */}
            {step === 'input' && (
              <form onSubmit={handleSubmit} noValidate>
                <div className="space-y-4">
                  <div>
                    <FieldLabel htmlFor={acctId}>Account Number</FieldLabel>
                    <ReadonlyField id={acctId} value={accountNumber} />
                  </div>

                  {!isDeposit && (
                    <div>
                      <FieldLabel htmlFor={balanceId}>Available Balance</FieldLabel>
                      <div
                        id={balanceId}
                        className="flex items-center justify-between px-4 py-3 rounded-lg bg-ground/60 border border-storm-dim/60"
                      >
                        <span className="font-display text-sm font-semibold text-text-hi tabular-nums">
                          {formatCurrencyCompact(currentBalance)}
                        </span>
                        <Lock size={12} className="text-text-low" aria-hidden="true" />
                      </div>
                    </div>
                  )}

                  <div>
                    <FieldLabel htmlFor={amountId}>Amount (USD)</FieldLabel>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-lg text-text-mid pointer-events-none" aria-hidden="true">$</span>
                      <input
                        id={amountId}
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0.01"
                        max={!isDeposit ? currentBalance : undefined}
                        value={amount}
                        onChange={(e) => { setAmount(e.target.value); setError(null); }}
                        className="w-full pl-8 pr-4 py-3 rounded-lg bg-ground border border-storm-dim text-text-hi placeholder:text-text-low focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-colors text-xl font-display"
                        placeholder="0.00"
                        required
                        aria-describedby={error ? `${amountId}-error` : undefined}
                        autoFocus
                      />
                    </div>
                  </div>

                  {error && <ErrorMessage message={error} />}

                  <motion.button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-panel ${btnClass}`}
                    whileHover={!loading ? { scale: 1.015 } : {}}
                    whileTap={!loading ? { scale: 0.985 } : {}}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={15} className="animate-spin-slow" aria-hidden="true" />
                        Processing…
                      </>
                    ) : (
                      <>
                        <ActionIcon size={15} aria-hidden="true" />
                        {isDeposit ? 'Deposit Funds' : 'Withdraw Funds'}
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            )}

            {/* ── Complete Step ──────────────────────────────────────────── */}
            {step === 'complete' && (
              <div className="space-y-5">
                <div className="text-center py-2">
                  <SuccessAnimation />
                  <p className="text-base font-semibold text-text-hi mt-4">
                    {isDeposit ? 'Deposit Complete' : 'Withdrawal Complete'}
                  </p>
                  <p className="text-xs text-text-mid mt-1">
                    Your account balance has been updated
                  </p>
                </div>

                <div className={`px-4 py-3.5 rounded-lg border ${summaryBg}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-text-mid uppercase tracking-wide">
                      {isDeposit ? 'Amount Deposited' : 'Amount Withdrawn'}
                    </span>
                    <span className={`font-display font-semibold text-base tabular-nums ${summaryColor}`}>
                      {formatCurrencyCompact(parseFloat(amount))}
                    </span>
                  </div>
                </div>

                <motion.button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-3 rounded-lg bg-gold text-ground font-semibold text-sm hover:bg-gold-dim transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                >
                  Done
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DepositWithdrawModal;
