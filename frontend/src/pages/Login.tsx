import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, KeyRound, ArrowRight } from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('threatcast123');
  const [mfaCode, setMfaCode] = useState('842910');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      navigate('/dashboard');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 cyber-grid flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.3)]">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold font-mono tracking-wider text-slate-100">THREATCAST OPERATOR AUTH</h2>
          <p className="text-xs text-slate-400 font-mono">Zero Trust Authentication Gateway · RBAC Controlled</p>
        </div>

        <GlassCard glow="cyan" className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
            <div className="space-y-1">
              <label className="text-slate-300">Operator Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300">MFA TOTP Challenge Code</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-cyan-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-cyan-500/40 rounded-lg text-cyan-300 font-bold focus:outline-none tracking-widest text-center"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-bold rounded-lg shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to SOC Console'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="p-3 rounded bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 text-center">
              Evaluation Credentials Pre-filled: <span className="text-cyan-400">admin / threatcast123</span>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};
