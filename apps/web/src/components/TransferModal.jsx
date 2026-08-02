import React, { useState, useEffect, useCallback, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpRight, Link2, Loader2, Lock } from 'lucide-react';
import SettlementTimeline from './SettlementTimeline';
import SuccessAnimation from './SuccessAnimation';
import CopyableText from './CopyableText';
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

// ─── TransferModal ────────────────────────────────────────────────────────────

const TransferModal = ({ isOpen, onClose, fromAccount, onTransferComplete }) => {
  const [step, setStep] = useState('input');
  const [amount, setAmount] = useState('');
  const [toAccountInput, setToAccountInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transaction, setTransaction] = useState(null);
  const [settlementStage, setSettlementStage] = useState(null);
  const [confirmationCount, setConfirmationCount] = useState(0);

  const titleId = useId();
  const amountId = useId();
  const fromId = useId();
  const toId = useId();

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    setStep('input');
    setAmount('');
    setToAccountInput('');
    setError(null);
    setTransaction(null);
    setSettlementStage(null);
    setConfirmationCount(0);
    onClose();
  }, [onClose]);

  const handleTransfer = useCallback(async (e) => {
    e.preventDefault();
    if (loading) return;

    const destination = toAccountInput.trim();
    if (!destination || destination.length !== 12 || !/^\d{12}$/.test(destination)) {
      setError('Please enter a valid 12-digit account number.');
      return;
    }

    if (destination === fromAccount) {
      setError('Destination account cannot be the same as the source account.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const response = await fastAPI.transfer(fromAccount, destination, parsedAmount);
      setTransaction(response);
      setSettlementStage(response.settlement_stage);
      setStep('processing');
    } catch (err) {
      setError(err.message || 'Transfer failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [loading, amount, toAccountInput, fromAccount]);

  // ── Escape key handler ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && step !== 'processing') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, step, handleClose]);

  // ── Prevent background scroll ────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // ── Settlement polling ───────────────────────────────────────────────────
  useEffect(() => {
    let interval;
    if (step === 'processing' && transaction) {
      interval = setInterval(async () => {
        try {
          const updated = await fastAPI.processSettlement(transaction.id);
          setSettlementStage(updated.settlement_stage);
          setConfirmationCount(updated.confirmation_count || 0);

          if (updated.settlement_stage === 'DEPOSITED') {
            setStep('complete');
            onTransferComplete?.();
            clearInterval(interval);
          } else if (updated.settlement_stage === 'FAILED') {
            setError('Settlement failed on the blockchain.');
            setStep('input');
            clearInterval(interval);
          }
        } catch (err) {
          console.error('Settlement polling error:', err);
          setError(err.message || 'Settlement processing failed.');
          setStep('input');
          clearInterval(interval);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, transaction, onTransferComplete]);

  if (!isOpen) return null;

  const isProcessing = step === 'processing';

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
        onClick={(e) => { if (!isProcessing && e.target === e.currentTarget) handleClose(); }}
        aria-hidden="false"
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
          {/* Processing overlay bar */}
          {isProcessing && (
            <div className="h-0.5 bg-storm-dim overflow-hidden">
              <motion.div
                className="h-full bg-gold"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          )}

          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center" aria-hidden="true">
                  <ArrowUpRight size={14} className="text-gold" />
                </div>
                <h2
                  id={titleId}
                  className="font-display text-lg font-semibold text-text-hi"
                >
                  {step === 'input' ? 'Transfer Funds' : step === 'processing' ? 'Settlement in Progress' : 'Transfer Complete'}
                </h2>
              </div>
              <button
                onClick={handleClose}
                disabled={isProcessing}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-text-mid hover:text-text-hi hover:bg-storm-dim/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
                aria-label="Close transfer modal"
                type="button"
              >
                <X size={14} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>

            {/* ── Input Step ─────────────────────────────────────────────── */}
            {step === 'input' && (
              <form onSubmit={handleTransfer} noValidate>
                <div className="space-y-4">
                  <div>
                    <FieldLabel htmlFor={fromId}>From Account</FieldLabel>
                    <ReadonlyField id={fromId} value={fromAccount} />
                  </div>

                  <div>
                    <FieldLabel htmlFor={toId}>To Account Number</FieldLabel>
                    <input
                      id={toId}
                      type="text"
                      inputMode="numeric"
                      maxLength={12}
                      value={toAccountInput}
                      onChange={(e) => {
                        // Only allow digits
                        const v = e.target.value.replace(/\D/g, '').slice(0, 12);
                        setToAccountInput(v);
                        setError(null);
                      }}
                      className="w-full px-4 py-3 rounded-lg bg-ground border border-storm-dim text-text-hi placeholder:text-text-low font-mono tracking-widest focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-colors text-sm"
                      placeholder="12-digit account number"
                      autoComplete="off"
                      required
                    />
                    <p className="text-[10px] text-text-low mt-1.5">
                      Enter the recipient's 12-digit StormCash account number.
                    </p>
                  </div>

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
                    className="w-full py-3 rounded-lg bg-gold text-ground font-semibold text-sm hover:bg-gold-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
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
                        <ArrowUpRight size={15} aria-hidden="true" />
                        Initiate Transfer
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            )}

            {/* ── Processing Step ────────────────────────────────────────── */}
            {step === 'processing' && (
              <div className="space-y-6">
                <div className="text-center py-2">
                  <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
                    <Link2 size={20} className="text-gold" aria-hidden="true" />
                  </div>
                  <p className="text-sm font-medium text-text-hi">Blockchain Settlement</p>
                  <p className="text-xs text-text-mid mt-1 max-w-[260px] mx-auto">
                    Your transfer is being processed through the StormChain network
                  </p>
                </div>

                <SettlementTimeline
                  settlementStage={settlementStage}
                  confirmationCount={confirmationCount}
                />

                {transaction?.blockchain_tx_hash && (
                  <div className="px-4 py-3.5 rounded-lg bg-storm-dim/10 border border-storm-dim">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-mid mb-2">
                      Transaction Hash
                    </p>
                    <CopyableText
                      value={transaction.blockchain_tx_hash}
                      maxLength={12}
                      className="text-text-hi"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── Complete Step ──────────────────────────────────────────── */}
            {step === 'complete' && (
              <div className="space-y-5">
                <div className="text-center py-2">
                  <SuccessAnimation />
                  <p className="text-base font-semibold text-text-hi mt-4">Transfer Complete</p>
                  <p className="text-xs text-text-mid mt-1">
                    Funds have been successfully delivered
                  </p>
                </div>

                <div className="px-4 py-3.5 rounded-lg bg-gold/8 border border-gold/20">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-text-mid uppercase tracking-wide">Amount Sent</span>
                    <span className="font-display font-semibold text-gold text-base tabular-nums">
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

export default TransferModal;
