import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Sky from '../components/Sky';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.password_confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await register(form.username, form.email, form.password, form.password_confirm);
      if (data?.access) {
        navigate('/dashboard?welcome=1', { replace: true });
      } else {
        // Surface the first error message from the Django serializer
        const firstError =
          data?.username?.[0] ||
          data?.email?.[0] ||
          data?.password?.[0] ||
          data?.non_field_errors?.[0] ||
          data?.detail ||
          'Registration failed. Please try again.';
        setError(firstError);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-ground">
      <Sky trend="stable" height="100vh" />

      <div className="absolute inset-0 flex items-center justify-center px-6">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Back to home */}
          <div className="mb-6 text-center">
            <Link
              to="/"
              className="text-xs text-text-low hover:text-text-mid transition-colors uppercase tracking-widest font-semibold"
            >
              ← StormCash
            </Link>
          </div>

          <div className="rounded-2xl p-8 border bg-panel border-storm-dim/40">
            <div className="text-center mb-8">
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-4">
                <span className="font-display text-gold font-black text-lg leading-none">S</span>
              </div>
              <h1 className="font-display text-2xl font-black text-text-hi tracking-tight mb-1">
                Create your account
              </h1>
              <p className="text-sm text-text-low">
                Open a StormCash prototype account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {error && (
                <motion.div
                  role="alert"
                  className="rounded-lg px-4 py-3 text-sm bg-rose-400/10 border border-rose-400/25 text-rose-300"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-mid mb-1.5" htmlFor="reg-username">
                  Username
                </label>
                <input
                  id="reg-username"
                  name="username"
                  type="text"
                  value={form.username}
                  onChange={handleChange}
                  className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold/40 transition-colors bg-ground border border-storm-dim/40 text-text-hi placeholder:text-text-low"
                  placeholder="your_username"
                  autoComplete="username"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-mid mb-1.5" htmlFor="reg-email">
                  Email
                </label>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold/40 transition-colors bg-ground border border-storm-dim/40 text-text-hi placeholder:text-text-low"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-mid mb-1.5" htmlFor="reg-password">
                  Password
                </label>
                <input
                  id="reg-password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold/40 transition-colors bg-ground border border-storm-dim/40 text-text-hi placeholder:text-text-low"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-mid mb-1.5" htmlFor="reg-confirm">
                  Confirm password
                </label>
                <input
                  id="reg-confirm"
                  name="password_confirm"
                  type="password"
                  value={form.password_confirm}
                  onChange={handleChange}
                  className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold/40 transition-colors bg-ground border border-storm-dim/40 text-text-hi placeholder:text-text-low"
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  required
                />
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gold text-ground hover:bg-gold-dim mt-2"
                whileHover={!isLoading ? { scale: 1.015 } : {}}
                whileTap={!isLoading ? { scale: 0.985 } : {}}
              >
                {isLoading ? 'Creating account…' : 'Create account'}
              </motion.button>
            </form>

            {/* Prototype notice */}
            <p className="mt-5 text-center text-[10.5px] text-text-low leading-relaxed">
              This is a prototype — no real money is involved.
            </p>

            <div className="mt-5 pt-5 border-t border-storm-dim/20 text-center">
              <p className="text-sm text-text-low">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-gold hover:text-gold-dim transition-colors font-semibold"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
