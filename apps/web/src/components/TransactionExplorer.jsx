import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, ExternalLink, Loader2 } from 'lucide-react';
import { fastAPI } from '../services/api';
import CopyableText from './CopyableText';
import ConfirmationProgress from './ConfirmationProgress';

// ─── Detail row ───────────────────────────────────────────────────────────────
const DetailRow = ({ label, value, copyable = false, highlight = false }) => (
  <div
    className={[
      'flex justify-between items-start py-3 border-b border-storm-dim/40 last:border-0',
      highlight ? 'px-4 -mx-4 bg-gold/5 rounded-lg' : '',
    ].join(' ')}
  >
    <span className="text-xs font-medium text-text-mid uppercase tracking-wide flex-shrink-0 mr-4 pt-0.5">
      {label}
    </span>
    <div className="flex items-center gap-2 text-right min-w-0">
      {copyable && value ? (
        <CopyableText
          value={value}
          maxLength={10}
          className={highlight ? 'text-gold' : 'text-text-hi'}
        />
      ) : (
        <span className={[
          'text-sm font-medium break-all',
          highlight ? 'text-gold font-semibold' : 'text-text-hi',
        ].join(' ')}>
          {value || 'N/A'}
        </span>
      )}
    </div>
  </div>
);

// ─── Section card ─────────────────────────────────────────────────────────────
const SectionCard = ({ title, children, delay = 0 }) => (
  <motion.div
    className="rounded-xl border border-storm-dim bg-panel overflow-hidden"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
  >
    <div className="px-4 py-3 border-b border-storm-dim/50 bg-storm-dim/5">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-mid">
        {title}
      </h3>
    </div>
    <div className="p-4">
      {children}
    </div>
  </motion.div>
);

// ─── TransactionExplorer ─────────────────────────────────────────────────────
const TransactionExplorer = ({ transactionId, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!transactionId) return;
    let cancelled = false;

    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = await fastAPI.getSettlementDetails(transactionId);
        if (!cancelled) {
          setDetails(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError('Failed to load transaction details.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDetails();
    return () => { cancelled = true; };
  }, [transactionId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 size={20} className="text-text-mid animate-spin-slow" aria-hidden="true" />
        <p className="text-xs text-text-mid">Loading transaction…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-[#c08090]">{error}</p>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-text-mid">No details available</p>
      </div>
    );
  }

  const isTransfer = details.transaction_type === 'TRANSFER';
  const isCompleted = details.settlement_stage === 'DEPOSITED' || !isTransfer;

  const typeLabel = isTransfer
    ? 'Transfer Details'
    : details.transaction_type === 'DEPOSIT'
      ? 'Deposit Details'
      : 'Withdrawal Details';

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="font-display text-lg font-semibold text-text-hi">
          Transaction Explorer
        </h2>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-text-mid hover:text-text-hi hover:bg-storm-dim/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
          aria-label="Close transaction explorer"
          type="button"
        >
          <X size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      {/* Status card */}
      <motion.div
        className="flex items-center justify-between px-4 py-3.5 rounded-xl border border-storm-dim bg-storm-dim/10"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-mid mb-0.5">Status</p>
          <p className={`text-sm font-semibold ${isCompleted ? 'text-[#7dc9a0]' : 'text-gold'}`}>
            {isCompleted ? 'Completed' : (details.settlement_stage || 'Pending')}
          </p>
        </div>
        {isCompleted && (
          <motion.div
            className="w-8 h-8 rounded-full bg-[#7dc9a0]/15 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <span className="text-[#7dc9a0] text-sm" aria-hidden="true">✓</span>
          </motion.div>
        )}
      </motion.div>

      {/* Transaction details */}
      <SectionCard title={typeLabel} delay={0.05}>
        <DetailRow label="Reference" value={details.reference_id} copyable />
        {isTransfer ? (
          <>
            <DetailRow label="From" value={details.from_account} />
            <DetailRow label="To" value={details.to_account} />
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-text-mid">Sent</span>
                <span className="text-text-hi tabular-nums font-medium">
                  ${details.blockchain_amount?.toFixed(2) ?? '0.00'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-mid">Network Fee</span>
                <span className="text-text-hi tabular-nums font-medium">
                  ${details.gas_fee?.toFixed(6) ?? '0.000000'}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-storm-dim/40">
                <span className="text-xs font-semibold text-gold uppercase tracking-wide">Recipient Receives</span>
                <span className="font-display font-semibold text-gold text-base tabular-nums">
                  ${details.fiat_amount?.toFixed(2) ?? '0.00'}
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <DetailRow label="Account" value={details.from_account || details.to_account} />
            <div className="mt-3 flex justify-between items-center pt-2 border-t border-storm-dim/40">
              <span className="text-xs font-semibold text-gold uppercase tracking-wide">Amount</span>
              <span className="font-display font-semibold text-gold text-base tabular-nums">
                ${details.fiat_amount?.toFixed(2) ?? '0.00'}
              </span>
            </div>
          </>
        )}
      </SectionCard>

      {/* Blockchain details — transfers only */}
      {isTransfer && (
        <SectionCard title="Blockchain Details" delay={0.1}>
          <DetailRow label="Network" value={details.network_name} />
          <DetailRow label="Tx Hash" value={details.blockchain_tx_hash} copyable />
          <DetailRow label="Block" value={details.block_number?.toString()} />
          {details.confirmation_count !== undefined && (
            <div className="pt-3 mt-1">
              <ConfirmationProgress current={details.confirmation_count} total={12} />
            </div>
          )}
          {details.settlement_time && (
            <DetailRow
              label="Settled"
              value={new Date(details.settlement_time).toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: 'numeric', minute: '2-digit', hour12: true,
              })}
            />
          )}
        </SectionCard>
      )}

      {/* Explorer link */}
      {isTransfer && details.explorer_url && (
        <motion.a
          href={details.explorer_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border border-gold/25 bg-gold/8 text-gold text-sm font-medium hover:bg-gold/14 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
        >
          View on StormChain Explorer
          <ExternalLink size={13} strokeWidth={2} aria-hidden="true" />
        </motion.a>
      )}
    </div>
  );
};

export default TransactionExplorer;
