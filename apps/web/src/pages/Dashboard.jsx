import React, { useState, useEffect } from 'react';
import Sky from '../components/Sky';
import PressureReading from '../components/PressureReading';
import StormLog from '../components/StormLog';
import ActionGrid from '../components/ActionGrid';
import { fastAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [trend, setTrend] = useState('stable');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Derive accountNumber dynamically from the user accounts
  const accountNumber = user?.accounts?.[0]?.account_number || '';

  useEffect(() => {
    if (!accountNumber) return;

    const fetchData = async () => {
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

    fetchData();
  }, [accountNumber]);

  const handleAction = (actionId) => {
    console.log('Action clicked:', actionId);
  };

  return (
    <div className="min-h-screen relative bg-ground">
      <Sky trend={trend} height="100vh" />

      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div className="w-full max-w-4xl">
          <div className="rounded-2xl p-8 border bg-panel border-storm-dim">
            <div className="flex items-center justify-between mb-6">
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
              <div className="flex items-center justify-center py-12">
                <div className="text-text-mid">Loading dashboard data...</div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-storm">{error}</div>
              </div>
            ) : (
              <>
                <PressureReading balance={balance} trend={trend} />

                {balance === 0 && transactions.length === 0 && (
                  <div className="mt-6 p-6 rounded-xl border border-storm-dim bg-storm-dim/10">
                    <div className="text-center">
                      <div className="text-3xl mb-2 opacity-50">🌊</div>
                      <p className="text-text-hi font-medium mb-1">Welcome to StormCash</p>
                      <p className="text-sm text-text-mid">Your account is ready. Make a deposit to get started.</p>
                    </div>
                  </div>
                )}

                <div className="mt-8">
                  <ActionGrid onAction={handleAction} />
                </div>

                <div className="mt-8 pt-6 border-t border-storm-dim">
                  <StormLog transactions={transactions} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;