import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, User, KeyRound, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, ArrowLeft, ShieldCheck } from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { api } from '../services/api';

export const Register: React.FC = () => {
  const navigate = useNavigate();

  // Registration form state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ANALYST');

  // Step 2 OTP state
  const [step, setStep] = useState<'REGISTER' | 'VERIFY_OTP' | 'SUCCESS'>('REGISTER');
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(600); // 10 minutes
  const [resending, setResending] = useState(false);

  // Status & Error handling
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Countdown timer for OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'VERIFY_OTP' && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Step 1: Submit Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!username.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Please fill in all mandatory security clearance fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.auth.register({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        full_name: fullName.trim() || username.trim(),
        role
      });

      setSuccessMsg(res.message || 'OTP verification code dispatched to your email.');
      setCountdown(600);
      setStep('VERIFY_OTP');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initiate account clearance registration.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit OTP Verification
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (otpCode.trim().length !== 6) {
      setErrorMsg('Please enter the complete 6-digit numeric verification code.');
      return;
    }

    setLoading(true);
    try {
      await api.auth.verifyOtp(email.trim().toLowerCase(), otpCode.trim());
      setStep('SUCCESS');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setResending(true);
    setErrorMsg(null);
    try {
      const res = await api.auth.sendOtp(email.trim().toLowerCase());
      setSuccessMsg(res.message || 'New OTP dispatched.');
      setCountdown(600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 cyber-grid flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.3)]">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold font-mono tracking-wider text-slate-100">
            {step === 'VERIFY_OTP' ? 'SECURITY CLEARANCE OTP' : 'OPERATOR REGISTRATION'}
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            {step === 'VERIFY_OTP'
              ? 'Multi-Factor Email Verification · RBAC Enforced'
              : 'Request Enterprise SOC Identity & Clearance Access'}
          </p>
        </div>

        {/* Error / Info Alerts */}
        {errorMsg && (
          <div className="p-3 bg-red-950/70 border border-red-500/50 rounded-lg flex items-center gap-2.5 text-xs text-red-300 font-mono animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && step !== 'SUCCESS' && (
          <div className="p-3 bg-cyan-950/70 border border-cyan-500/50 rounded-lg flex items-center gap-2.5 text-xs text-cyan-300 font-mono animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Step 1: Registration Form */}
        {step === 'REGISTER' && (
          <GlassCard glow="cyan" className="p-6">
            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-slate-300">Operator Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300">Operator Username *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="jdoe_secops"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300">Official Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="operator@organization.soc"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300">Master Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300">Requested Clearance Tier</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ANALYST">Tier-1 / Tier-2 SOC Analyst</option>
                  <option value="TIER_3_ANALYST">Tier-3 Advanced Threat Hunter</option>
                  <option value="SECOPS_LEAD">SecOps Lead (Active Defence Authorized)</option>
                  <option value="AUDITOR">Compliance & Blockchain Auditor</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-bold rounded-lg shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Initiating Clearance...' : 'Send Verification OTP'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center text-slate-400">
                <span>Already possess operational clearance? </span>
                <Link to="/login" className="text-cyan-400 hover:underline">
                  Sign In
                </Link>
              </div>
            </form>
          </GlassCard>
        )}

        {/* Step 2: OTP Verification Screen */}
        {step === 'VERIFY_OTP' && (
          <GlassCard glow="cyan" className="p-6">
            <form onSubmit={handleVerifySubmit} className="space-y-5 text-xs font-mono">
              <div className="text-center space-y-1.5 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
                <p className="text-slate-400">One-Time Passcode (OTP) dispatched to:</p>
                <p className="text-cyan-400 font-bold tracking-wide">{email}</p>
                <p className="text-[11px] text-slate-500 pt-1">
                  Please check your inbox (and spam folder) for the 6-digit security code.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-slate-300">
                  <label>Enter 6-Digit Code</label>
                  <span className="text-slate-500">Expires: {formatCountdown(countdown)}</span>
                </div>
                <div className="relative">
                  <KeyRound className="w-5 h-5 text-cyan-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    required
                    placeholder="••••••"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-cyan-500/50 rounded-lg text-cyan-300 font-bold text-lg tracking-[0.4em] text-center focus:outline-none focus:border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 disabled:opacity-50 text-slate-950 font-bold rounded-lg shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Verifying Code...' : 'Verify & Activate Account'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between pt-2 text-slate-400 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setStep('REGISTER')}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>

                <button
                  type="button"
                  disabled={resending}
                  onClick={handleResendOtp}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  <span>Resend OTP</span>
                </button>
              </div>
            </form>
          </GlassCard>
        )}

        {/* Step 3: Success Confirmation */}
        {step === 'SUCCESS' && (
          <GlassCard glow="cyan" className="p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold font-mono text-slate-100">CLEARANCE VERIFIED</h3>
            <p className="text-xs text-slate-300 font-mono">
              Identity authenticated and access granted. Initializing SOC Mission Control Console...
            </p>
            <div className="w-8 h-8 mx-auto border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};
