import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, User, KeyRound, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { api } from '../services/api';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('threatcast123');
  const [mfaCode, setMfaCode] = useState('842910');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await api.auth.login(username.trim(), password.trim());
      setSuccessMsg('Authentication successful. Redirecting to SOC Console...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
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

        {errorMsg && (
          <div className="p-3 bg-red-950/70 border border-red-500/50 rounded-lg flex items-center gap-2.5 text-xs text-red-300 font-mono animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <div className="flex-1">
              <span>{errorMsg}</span>
              {errorMsg.toLowerCase().includes('otp') && (
                <div className="mt-1">
                  <Link to="/register" className="text-cyan-400 underline font-bold">
                    Go to OTP Verification &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-lg flex items-center gap-2.5 text-xs text-emerald-300 font-mono animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <GlassCard glow="cyan" className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
            <div className="space-y-1">
              <label className="text-slate-300">Operator Username or Email</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
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
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300">MFA TOTP Challenge Code (Optional)</label>
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
              className="w-full mt-2 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-bold rounded-lg shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to SOC Console'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-center text-slate-400 border-t border-slate-800/80 flex flex-col gap-2">
              <div>
                <span>Need operator clearance? </span>
                <Link to="/register" className="text-cyan-400 hover:underline font-bold">
                  Register & Verify OTP
                </Link>
              </div>
              <div className="text-[11px] text-slate-500">
                Evaluation Credentials: <span className="text-cyan-400">admin / threatcast123</span>
              </div>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};
