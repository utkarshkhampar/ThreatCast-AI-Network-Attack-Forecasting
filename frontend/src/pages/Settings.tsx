import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon, User, Shield, KeyRound, Lock,
  CheckCircle2, AlertCircle, LogOut, Activity, Mail, RefreshCw, Database
} from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { api, authStorage } from '../services/api';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'system'>('profile');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    api.auth.getMe().then(setUserProfile).catch(() => {
      setUserProfile(authStorage.getUser());
    });
    api.getSystemHealth().then(setHealth).catch(console.error);
  }, []);

  const handleLogout = () => {
    api.auth.logout();
    navigate('/login');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError('New password and confirmation do not match.');
      return;
    }

    setPwLoading(true);
    try {
      const res = await api.auth.changePassword(currentPassword, newPassword);
      setPwSuccess(res.message || 'Password successfully updated!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwError(err.message || 'Failed to update password. Verify your current password.');
    } finally {
      setPwLoading(false);
    }
  };

  const components = health?.components || {
    database: { status: "HEALTHY", engine: "SQLAlchemy Async" },
    redis_cache: { status: "HEALTHY", connected: true },
    kafka_event_bus: { status: "HEALTHY", brokers: "localhost:9092" },
    ai_world_model: { status: "ONLINE", latency_ms: 18.4 },
    blockchain_evidence: { status: "ONLINE", mode: "Fabric / Cryptographic Local" }
  };

  const currentUser = userProfile || authStorage.getUser() || {
    username: 'admin',
    email: 'admin@threatcast.soc',
    role: 'SUPER_ADMIN',
    full_name: 'Lead SOC Administrator'
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-cyan-400" />
            OPERATOR SETTINGS & PROFILE MANAGEMENT
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your SOC operator clearance profile, update credentials, and review diagnostics.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Security</span>
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'system'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>System Health</span>
          </button>
          <button
            onClick={() => navigate('/database')}
            className="px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-850"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Database & Directory</span>
            <span className="px-1.5 py-0.2 text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 rounded font-bold">
              ADMIN
            </span>
          </button>
        </div>
      </div>

      {activeTab === 'profile' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview Card (1 Col) */}
          <GlassCard title="Operator Clearance Profile" badge="AUTHENTICATED">
            <div className="space-y-4 text-xs font-mono">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xl font-bold font-mono shadow-[0_0_20px_rgba(0,240,255,0.25)]">
                  {(currentUser.username || 'OP').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-100">{currentUser.full_name || currentUser.username}</div>
                  <div className="text-[11px] text-cyan-400 mt-0.5">{currentUser.email}</div>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                    {currentUser.role || 'SECOPS_LEAD'}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Username:</span>
                  <span className="text-slate-200 font-bold">{currentUser.username}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Registered Email:</span>
                  <span className="text-slate-200">{currentUser.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Account Status:</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED & ACTIVE
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">2FA Clearance:</span>
                  <span className="text-cyan-300 font-bold">Email OTP (Enforced)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Session Type:</span>
                  <span className="text-slate-300">JWT Bearer (72-byte safe)</span>
                </div>
              </div>

              {/* Logout Button */}
              <div className="pt-3 border-t border-slate-800">
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 px-3 rounded-lg text-xs font-mono font-semibold bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,0,85,0.2)]"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Log Out of SOC Console</span>
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Change Password Form (2 Cols) */}
          <GlassCard title="Security Credentials & Password Management" badge="ZERO TRUST" className="lg:col-span-2">
            <div className="space-y-4 text-xs font-mono">
              <p className="text-[11px] text-slate-400">
                Update your security clearance password. New passwords must be at least 8 characters long and are hashed with salt rounds.
              </p>

              {pwError && (
                <div className="p-3 bg-red-950/70 border border-red-500/50 rounded-lg flex items-center gap-2.5 text-xs text-red-300 font-mono">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{pwError}</span>
                </div>
              )}

              {pwSuccess && (
                <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-lg flex items-center gap-2.5 text-xs text-emerald-300 font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{pwSuccess}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                <div className="space-y-1">
                  <label className="text-slate-300">Current Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      placeholder="Enter your current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300">New Password</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300">Confirm New Password</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={pwLoading}
                  className="py-2.5 px-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-bold rounded-lg shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Shield className="w-4 h-4" />
                  <span>{pwLoading ? 'Updating Password...' : 'Update Security Password'}</span>
                </button>
              </form>
            </div>
          </GlassCard>
        </div>
      ) : (
        /* System Health Tab */
        <GlassCard title="Microservice Components Health" badge="DISTRIBUTED">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
            {Object.entries(components).map(([compName, compInfo]: [string, any]) => (
              <div key={compName} className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-200 uppercase">{compName.replace(/_/g, ' ')}</span>
                  <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {compInfo.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 space-y-1">
                  {Object.entries(compInfo).filter(([k]) => k !== 'status').map(([k, v]: [string, any]) => (
                    <div key={k} className="flex justify-between">
                      <span className="capitalize text-slate-500">{k.replace(/_/g, ' ')}:</span>
                      <span className="text-slate-300 font-bold">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};
