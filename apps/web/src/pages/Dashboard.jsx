import React, { useState, useEffect } from 'react';
import Sky from '../components/Sky';
import PressureReading from '../components/PressureReading';
import StormLog from '../components/StormLog';
import ActionGrid from '../components/ActionGrid';
import { fastAPI } from '../services/api';

const Dashboard = () => {
  const [balance, setBalance] = useState(0);
  const [trend, setTrend] = useState('stable');
  const [transactions, setTransactions] = useState([]);
  const [usingMockData, setUsingMockData] = useState(false);
  const [accountNumber] = useState('1234567890'); // This would come from auth context

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch balance
        const balanceData = await fastAPI.getBalance(accountNumber);
        setBalance(parseFloat(balanceData.balance));
        
        // Determine trend based on recent transactions
        const historyData = await fastAPI.getHistory(accountNumber);
        const txs = historyData.transactions || [];
        setTransactions(txs);
        
        // Simple trend logic: if last transaction was credit, trend is rising
        if (txs.length > 0) {
          const lastTx = txs[0];
          setTrend(lastTx.transaction_type === 'deposit' ? 'rising' : 'stable');
        }
        
        setUsingMockData(false);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        // Use mock data for development when API isn't available
        if (import.meta.env.DEV) {
          setBalance(12543.67);
          setTrend('rising');
          setTransactions([]);
          setUsingMockData(true);
        } else {
          // In production, don't use mock data - let the error propagate
          throw error;
        }
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
              {usingMockData && (
                <div className="px-3 py-1 rounded-full text-xs font-medium bg-gold/20 text-gold border border-gold/30">
                  Demo Mode
                </div>
              )}
            </div>
            
            <PressureReading balance={balance} trend={trend} />
            
            <div className="mt-8">
              <ActionGrid onAction={handleAction} />
            </div>
            
            <div className="mt-8 pt-6 border-t border-storm-dim">
              <StormLog transactions={transactions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;