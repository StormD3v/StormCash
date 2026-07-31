import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Sky from '../components/Sky';
import { useAuth } from '../contexts/AuthContext';

const ObservatoryLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid credentials');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ground">
      <Sky trend="stable" height="50vh" />
      
      <div className="flex-1 flex items-center justify-center px-6 -mt-20">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="rounded-2xl p-8 border bg-panel border-storm-dim">
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-semibold mb-2 text-text-hi">
                Welcome Back
              </h1>
              <p className="text-sm text-text-mid">
                The atmosphere is calm
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg px-4 py-2 text-sm bg-storm/20 border border-storm/50 text-storm">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-2 text-text-hi">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-lg px-4 py-3 placeholder:text-sm focus:outline-none transition-colors bg-ground border border-storm-dim text-text-hi"
                  placeholder="your_username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-text-hi">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg px-4 py-3 placeholder:text-sm focus:outline-none transition-colors bg-ground border border-storm-dim text-text-hi"
                  placeholder="••••••••"
                  required
                />
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50 bg-gold text-ground"
                whileHover={!isLoading ? { scale: 1.02 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </motion.button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-text-mid">
                Don't have an account?{' '}
                <button className="transition-colors text-gold">
                  Sign up
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ObservatoryLogin;