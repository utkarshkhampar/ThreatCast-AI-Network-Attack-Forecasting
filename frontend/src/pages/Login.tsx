import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, User, Mail, ArrowRight, AlertCircle, CheckCircle2, RotateCcw, ArrowLeft } from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { api } from '../services/api';

export const Login: React.FC = () => {
  const [step, setStep] = useState<'CREDENTIALS' | 'OTP'>('CREDENTIALS');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Step 1: Submit Username/Email and Password -> Triggers Email OTP
  const handleInitiateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both your operator username/email and password.');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await api.auth.loginInitiate(username.trim(), password.trim());
      setTargetEmail(res.email || username.trim());
      setSuccessMsg(res.message || 'Verification code dispatched to your registered email.');
      setStep('OTP');
      setCountdown(30);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Only registered operators can log in.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit 6-digit OTP code received via Email
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setErrorMsg('Please enter the complete 6-digit verification code received in your email.');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await api.auth.loginVerifyOtp(username.trim(), otpCode.trim());
      setSuccessMsg('Security clearance verified! Entering SOC Console...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired verification code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  // Resend Login OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setErrorMsg(null);
    try {
      const res = await api.auth.resendLoginOtp(username.trim());
      setSuccessMsg(res.message || 'A fresh verification code has been dispatched to your email.');
      setCountdown(45);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend code. Please try again in a few moments.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 cyber-grid flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.3)]">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold font-mono tracking-wider text-slate-100">
            {step === 'CREDENTIALS' ? 'THREATCAST OPERATOR AUTH' : 'EMAIL 2FA CLEARANCE'}
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            {step === 'CREDENTIALS'
              ? 'Zero Trust Authentication Gateway · Registered Operators Only'
              : 'Two-Factor Authentication · Code Dispatched to Registered Email'}
          </p>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="p-3 bg-red-950/70 border border-red-500/50 rounded-lg flex items-center gap-2.5 text-xs text-red-300 font-mono animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <div className="flex-1">
              <span>{errorMsg}</span>
              {errorMsg.toLowerCase().includes('register') && (
                <div className="mt-1">
                  <Link to="/register" className="text-cyan-400 underline font-bold">
                    Create New Operator Account &rarr;
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
          {step === 'CREDENTIALS' ? (
            /* STEP 1: Enter Username/Email and Password */
            <form onSubmit={handleInitiateLogin} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-slate-300">Registered Username or Email</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. analyst1 or operator@email.com"
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
                    placeholder="Enter your security password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-bold rounded-lg shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? 'Verifying & Sending OTP...' : 'Verify Credentials & Send Login OTP'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center text-slate-400 border-t border-slate-800/80 flex flex-col gap-2">
                <div>
                  <span>Need operator clearance? </span>
                  <Link to="/register" className="text-cyan-400 hover:underline font-bold">
                    Register New Account
                  </Link>
                </div>
                <div className="text-[11px] text-slate-500">
                  Secured by Email Multi-Factor Authentication (2FA)
                </div>
              </div>
            </form>
          ) : (
            /* STEP 2: Enter 6-digit Code from Email */
            <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs font-mono">
              <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-lg flex items-start gap-2.5 text-cyan-200">
                <Mail className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  We sent a 6-digit code to <strong className="text-cyan-300 font-bold">{targetEmail}</strong>. Check your inbox and enter the code below to complete sign-in.
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 flex justify-between">
                  <span>Enter 6-Digit Email Code</span>
                  <span className="text-slate-500 text-[10px]">Case-insensitive numeric</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="------"
                  className="w-full px-3 py-3 bg-slate-900 border border-cyan-500/60 rounded-lg text-cyan-300 text-2xl font-bold tracking-[0.6em] text-center focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,240,255,0.3)] font-mono transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-bold rounded-lg shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Confirm OTP & Enter SOC Console'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setStep('CREDENTIALS');
                    setOtpCode('');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Account</span>
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={countdown > 0 || resending}
                  className="text-cyan-400 hover:underline flex items-center gap-1 disabled:text-slate-600 disabled:no-underline"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  <span>{countdown > 0 ? `Resend code (${countdown}s)` : 'Resend Code'}</span>
                </button>
              </div>
            </form>
          )}
        </GlassCard>
      </div>
    </div>
  );
};
