import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sky from '../components/Sky';
import PressureReading from '../components/PressureReading';
import StormLog from '../components/StormLog';
import ActionGrid from '../components/ActionGrid';
import TransferModal from '../components/TransferModal';
import TransactionExplorer from '../components/TransactionExplorer';
import { TransactionSkeleton } from '../components/SkeletonLoader';
import { fastAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [trend, setTrend] = useState('stable');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Transfer modal state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showTransactionExplorer, setShowTransactionExplorer] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);

  // Derive accountNumber dynamically from the user accounts
  const accountNumber = user?.accounts?.[0]?.account_number || '';

  // For demo purposes, use a hardcoded second account for transfers
  // In production, this would come from user's other accounts
  const toAccountNumber = '987654321098';

  const fetchData = async () => {
    if (!accountNumber) return;

    setLoading(true);
    setError(null);
    try {
      // Fetch balance
      const balanceData = await fastAPI.getBalance(accountNumber);
      setBalance(parseFloat(balanceData.balance));

      // Determine trend based on recent transactions
      const historyData = await fastAPI.getHistory(accountNumber);
      const txs = historyData.transactions || [];
      setTransactions(txs);

      // Simple trend logic: if last transaction was credit, trend is rising
      if (txs.length > 0 && balance > 0) {
        const lastTx = txs[0];
        setTrend(lastTx.transaction_type === 'deposit' ? 'rising' : 'stable');
      } else {
        setTrend('stable');
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [accountNumber]);

  const handleAction = (actionId) => {
    console.log('Action clicked:', actionId);
    if (actionId === 'history') {
      // For now, just show a message - could expand to full history page
      alert('Transaction history feature coming soon!');
    }
  };

  const handleTransfer = () => {
    setShowTransferModal(true);
  };

  const handleTransferComplete = () => {
    // Refresh data after transfer completes
    fetchData();
  };

  const handleTransactionClick = (transactionId) => {
    setSelectedTransactionId(transactionId);
    setShowTransactionExplorer(true);
  };

  return (
    <div className="min-h-screen relative bg-ground">
      <Sky trend={trend} height="100vh" />

      <div className="absolute inset-0 flex items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-4xl">
          <div className="rounded-2xl p-6 sm:p-8 border bg-panel border-storm-dim shadow-lg">
            <div className="flex items-center justify-between mb-8">
              <h1 className="font-display text-2xl font-semibold text-text-hi">
                Dashboard
              </h1>
              {loading && (
                <div className="px-3 py-1 rounded-full text-xs font-medium bg-storm-dim text-text-mid">
                  Loading...
                </div>
              )}
              {error && (
                <div className="px-3 py-1 rounded-full text-xs font-medium bg-storm/20 text-storm border border-storm/30">
                  Error
                </div>
              )}
            </div>

            {loading ? (
              <div className="py-8">
                <TransactionSkeleton />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-storm">{error}</div>
              </div>
            ) : (
              <>
                <PressureReading balance={balance} trend={trend} />

                {balance === 0 && transactions.length === 0 && (
                  <div className="mt-8 p-8 rounded-xl border border-storm-dim bg-storm-dim/10 text-center">
                    <div className="text-4xl mb-3 opacity-50">🌊</div>
                    <p className="text-text-hi font-medium mb-2">Welcome to StormCash</p>
                    <p className="text-sm text-text-mid">Your account is ready. Make a deposit to get started.</p>
                  </div>
                )}

                <div className="mt-8">
                  <ActionGrid onAction={handleAction} onTransfer={handleTransfer} />
                </div>

                <div className="mt-8 pt-8 border-t border-storm-dim">
                  <StormLog
                    transactions={transactions}
                    onTransactionClick={handleTransactionClick}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      <AnimatePresence>
        {showTransferModal && (
          <TransferModal
            isOpen={showTransferModal}
            onClose={() => setShowTransferModal(false)}
            fromAccount={accountNumber}
            toAccount={toAccountNumber}
            onTransferComplete={handleTransferComplete}
          />
        )}
      </AnimatePresence>

      {/* Transaction Explorer */}
      {showTransactionExplorer && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-2xl rounded-2xl border bg-panel border-storm-dim p-6"
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <TransactionExplorer
              transactionId={selectedTransactionId}
              onClose={() => setShowTransactionExplorer(false)}
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
