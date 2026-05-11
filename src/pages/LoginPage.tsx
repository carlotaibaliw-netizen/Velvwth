import React, { useState } from 'react';
import { motion } from 'motion/react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, HelpCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // In this app, users might use their loan ID as email if we map it, 
      // but for now we follow firebase auth login pattern.
      // If user wants loanId login, we'd need to fetch user by loanId then sign in.
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-brand-light">
      <div className="w-full max-w-sm">
        <div className="flex justify-end mb-4">
          <HelpCircle className="w-6 h-6 text-brand" />
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="w-48 h-32 bg-brand rounded-2xl flex items-center justify-center p-4 shadow-lg">
             {/* Simple Logo Placeholder */}
             <div className="text-white font-display border-4 border-white p-2 flex flex-col items-center">
                <span className="text-4xl font-bold leading-none">VLC</span>
                <span className="text-[10px] tracking-widest uppercase">Lending</span>
             </div>
          </div>
          <h1 className="mt-6 text-xl font-display font-bold text-brand text-center leading-tight">
            Hello there, Welcome<br />to Velveth Lending!
          </h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Username/Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent transition-all outline-none"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="password" 
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent transition-all outline-none"
              required
            />
          </div>

          <div className="flex justify-end">
            <button type="button" className="text-brand text-sm font-medium hover:underline">
              Forgot Password?
            </button>
          </div>

          {error && <p className="text-red-500 text-xs text-center">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="w-full py-4 bg-brand text-white font-bold rounded-lg shadow-lg hover:bg-brand/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-slate-500 text-sm">
          Don't have an account? <Link to="/register" className="text-green-600 font-bold hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
