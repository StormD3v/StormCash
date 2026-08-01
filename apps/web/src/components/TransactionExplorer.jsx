import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fastAPI } from '../services/api';
import CopyableText from './CopyableText';
import ConfirmationProgress from './ConfirmationProgress';

const TransactionExplorer = ({ transactionId, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = await fastAPI.getSettlementDetails(transactionId);
        setDetails(data);
        setError(null);
      } catch (err) {
        setError('Failed to load transaction details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (transactionId) {
      fetchDetails();
    }
  }, [transactionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-text-mid">Loading transaction details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-storm">{error}</div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-text-mid">No transaction details available</div>
      </div>
    );
  }

  const DetailRow = ({ label, value, copyable = false, highlight = false }) => (
    <motion.div
      className={`flex justify-between items-start py-3 border-b border-storm-dim/50 ${highlight ? 'bg-gold/5 -mx-4 px-4' : ''}`}
      whileHover={{ backgroundColor: highlight ? 'rgba(217, 163, 92, 0.1)' : 'rgba(255, 255, 255, 0.02)' }}
      transition={{ duration: 0.2 }}
    >
      <span className="text-sm text-text-mid">{label}</span>
      <div className="flex items-center gap-2">
        {copyable && value ? (
          <CopyableText value={value} maxLength={8} className={`text-sm font-medium ${highlight ? 'text-gold' : 'text-text-hi'}`} />
        ) : (
          <span className={`text-sm font-medium font-mono ${highlight ? 'text-gold' : 'text-text-hi'}`}>
            {value || 'N/A'}
          </span>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="w-full flex flex-col" style={{ maxHeight: '80vh' }}>
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <h2 className="font-display text-xl font-semibold text-text-hi">
          Transaction Explorer
        </h2>
        <button
          onClick={onClose}
          className="px-3 py-1 rounded-lg text-sm bg-storm-dim text-text-mid hover:bg-storm-dim/80 transition-colors"
        >
          Close
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {/* Settlement Status */}
        <motion.div
          className="p-5 rounded-xl border border-storm-dim bg-storm-dim/10 flex-shrink-0 shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-text-mid mb-1">Settlement Status</div>
              <div className="font-semibold text-text-hi">
                {details.settlement_stage || 'Unknown'}
              </div>
            </div>
            {details.settlement_stage === 'DEPOSITED' && (
              <motion.div
                className="text-2xl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                ✅
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Transaction Details */}
        <motion.div
          className="rounded-xl border border-storm-dim bg-panel overflow-hidden flex-shrink-0 shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="p-4 border-b border-storm-dim bg-storm-dim/5">
            <h3 className="font-display text-lg font-semibold text-text-hi">
              Transfer Details
            </h3>
          </div>

          <div className="p-4 space-y-4">
            <DetailRow label="Reference ID" value={details.reference_id} copyable />
            <DetailRow label="From Account" value={details.from_account} />
            <DetailRow label="To Account" value={details.to_account} />

            {/* Amount hierarchy */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-mid">Fiat Sent</span>
                <span className="text-sm font-medium text-text-hi">
                  ${details.blockchain_amount?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-mid">Network Fee</span>
                <span className="text-sm font-medium text-text-hi">
                  ${details.gas_fee?.toFixed(6) || '0.00'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 px-4 rounded-lg bg-gold/5 border border-gold/20">
                <span className="text-sm font-medium text-gold">Recipient Receives</span>
                <span className="text-lg font-display font-semibold text-gold">
                  ${details.fiat_amount?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Blockchain Details */}
        <motion.div
          className="rounded-xl border border-storm-dim bg-panel overflow-hidden flex-shrink-0 shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="p-4 border-b border-storm-dim bg-storm-dim/5">
            <h3 className="font-display text-lg font-semibold text-text-hi">
              Blockchain Details
            </h3>
          </div>

          <div className="p-4 space-y-4">
            <DetailRow label="Network" value={details.network_name} />
            <DetailRow
              label="Transaction Hash"
              value={details.blockchain_tx_hash}
              copyable
            />
            <DetailRow label="Block Number" value={details.block_number?.toString()} />

            {/* Confirmation progress */}
            {details.confirmation_count !== undefined && (
              <div className="pt-2">
                <ConfirmationProgress current={details.confirmation_count} total={12} />
              </div>
            )}

            {details.settlement_time && (
              <DetailRow
                label="Settlement Time"
                value={new Date(details.settlement_time).toLocaleString()}
              />
            )}
          </div>
        </motion.div>

        {/* Explorer Link */}
        {details.explorer_url && (
          <motion.div
            className="flex-shrink-0"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <a
              href={details.explorer_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="font-medium">View on StormChain Explorer</span>
              <motion.span
                className="text-lg"
                whileHover={{ x: 4 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                ↗
              </motion.span>
            </a>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TransactionExplorer;
