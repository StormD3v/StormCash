import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SettlementTimeline from './SettlementTimeline';
import SuccessAnimation from './SuccessAnimation';
import { fastAPI } from '../services/api';

const TransferModal = ({ isOpen, onClose, fromAccount, toAccount, onTransferComplete }) => {
  const [step, setStep] = useState('input'); // input, processing, complete
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transaction, setTransaction] = useState(null);
  const [settlementStage, setSettlementStage] = useState(null);
  const [confirmationCount, setConfirmationCount] = useState(0);

  // Poll for settlement updates when processing
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
          }
        } catch (err) {
          console.error('Failed to process settlement:', err);
          // Stop polling immediately on any auth failure — the auth:expired
          // event has already been dispatched by fastAPIRequest, which will
          // trigger AuthContext to clear the session and navigate to /login.
          // Stopping here prevents any further authenticated requests during
          // the React re-render cycle.
          const isAuthError = (
            err.message === 'Refresh token expired' ||
            err.message === 'No refresh token' ||
            err.message === 'No access token'
          );
          if (isAuthError) {
            clearInterval(interval);
          }
        }
      }, 1000); // Poll every second
    }

    return () => clearInterval(interval);
  }, [step, transaction, onTransferComplete]);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fastAPI.transfer(fromAccount, toAccount, parseFloat(amount));
      setTransaction(response);
      setSettlementStage(response.settlement_stage);
      setStep('processing');
    } catch (err) {
      setError('Transfer failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('input');
    setAmount('');
    setError(null);
    setTransaction(null);
    setSettlementStage(null);
    setConfirmationCount(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-hidden">
      <motion.div
        className="w-full max-w-md rounded-2xl border bg-panel border-storm-dim p-6 shadow-xl"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-semibold text-text-hi">
            {step === 'input' ? 'Transfer Funds' : 'Settlement in Progress'}
          </h2>
          <button
            onClick={handleClose}
            className="text-text-mid hover:text-text-hi transition-colors"
            disabled={step === 'processing'}
          >
            ✕
          </button>
        </div>

        {/* Input Step */}
        {step === 'input' && (
          <form onSubmit={handleTransfer}>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-mid mb-2">
                  From Account
                </label>
                <div className="px-4 py-3 rounded-lg bg-storm-dim/20 border border-storm-dim text-text-hi font-mono text-sm">
                  {fromAccount}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-mid mb-2">
                  To Account
                </label>
                <div className="px-4 py-3 rounded-lg bg-storm-dim/20 border border-storm-dim text-text-hi font-mono text-sm">
                  {toAccount}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-mid mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-ground border border-storm-dim text-text-hi focus:outline-none focus:border-gold transition-colors text-lg font-display"
                  placeholder="0.00"
                  required
                />
              </div>

              {error && (
                <motion.div
                  className="p-3 rounded-lg bg-storm/20 border border-storm/30 text-storm text-sm"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-gold text-ground font-medium hover:bg-gold-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? 'Processing...' : 'Initiate Transfer'}
              </motion.button>
            </div>
          </form>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-3">⛓️</div>
              <p className="text-text-hi font-medium">Blockchain Settlement</p>
              <p className="text-sm text-text-mid mt-1">
                Your transfer is being processed through the StormChain network
              </p>
            </div>

            <SettlementTimeline
              settlementStage={settlementStage}
              confirmationCount={confirmationCount}
            />

            {transaction && (
              <div className="p-4 rounded-lg bg-storm-dim/10 border border-storm-dim">
                <div className="text-xs text-text-mid mb-1">Transaction Hash</div>
                <div className="font-mono text-sm text-text-hi break-all">
                  {transaction.blockchain_tx_hash}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <div className="space-y-6">
            <div className="text-center">
              <SuccessAnimation />
              <p className="text-text-hi font-medium mt-4">Transfer Complete</p>
              <p className="text-sm text-text-mid mt-1">
                Funds have been successfully delivered
              </p>
            </div>

            <div className="p-4 rounded-lg bg-gold/10 border border-gold/30">
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-mid">Amount Transferred</span>
                <span className="font-display font-semibold text-gold">
                  ${parseFloat(amount).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3 rounded-lg bg-gold text-ground font-medium hover:bg-gold-dim transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TransferModal;
