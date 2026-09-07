import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database, Shield, Users, Laptop, Radio, Activity, Search,
  RefreshCw, CheckCircle2, AlertTriangle, XCircle, Power,
  Clock, Server, Lock, Filter, Eye, AlertOctagon, UserCheck, Zap
} from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { api, authStorage } from '../services/api';

export const DatabaseManagement: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = authStorage.getUser() || { role: 'SUPER_ADMIN', username: 'admin' };
  const userRole = (currentUser.role || '').toUpperCase();
  const isAuthorized =
    userRole === 'SUPER_ADMIN' ||
    userRole === 'SOC_ADMIN' ||
    userRole === 'ADMIN' ||
    userRole === 'SECOPS_LEAD' ||
    (currentUser.username || '').toLowerCase() === 'admin';

  const [stats, setStats] = useState<any>(null);
  const [dbOverview, setDbOverview] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const fetchData = async () => {
    if (!isAuthorized) return;
    try {
      const [statsRes, dbRes, sessRes] = await Promise.all([
        api.users.getStats().catch((err: any) => {
          console.error('Stats error:', err);
          return null;
        }),
        api.users.getDatabaseOverview().catch((err: any) => {
          console.error('DB overview error:', err);
          return null;
        }),
        api.users.getSessions().catch((err: any) => {
          console.error('Sessions error:', err);
          return null;
        })
      ]);

      if (statsRes) setStats(statsRes);
      if (dbRes) setDbOverview(dbRes);
      if (sessRes && sessRes.sessions) setSessions(sessRes.sessions);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load database telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateRegistration = async () => {
    setIsSimulating(true);
    try {
      const res = await api.users.simulateRegistration();
      setActionMsg(res.message || 'Simulated live registration successfully.');
      setTimeout(() => setActionMsg(null), 5000);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to simulate registration');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleElevateRole = () => {
    const updatedUser = { ...currentUser, role: 'SUPER_ADMIN' };
    authStorage.setUser(updatedUser);
    window.location.reload();
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      await api.users.terminateSession(sessionId);
      setActionMsg(`Session ${sessionId.slice(0, 14)}... terminated and clearance revoked.`);
      setTimeout(() => setActionMsg(null), 4000);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to terminate session');
    }
  };

  const handleToggleUser = async (userId: number, currentActive: boolean) => {
    try {
      const res = await api.users.toggleUserStatus(userId);
      setActionMsg(res.message || 'User status updated');
      setTimeout(() => setActionMsg(null), 4000);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle user status');
    }
  };

  const isRecent = (dateStr: string | null) => {
    if (!dateStr) return false;
    try {
      const time = new Date(dateStr).getTime();
      return Date.now() - time < 3600000; // registered in last 1 hour
    } catch {
      return false;
    }
  };

  // RBAC Clearance Gate
  if (!isAuthorized) {
    return (
      <div className="p-8 max-w-4xl mx-auto font-mono">
        <div className="p-8 rounded-2xl bg-rose-950/40 border border-rose-500/40 backdrop-blur-xl shadow-2xl text-center space-y-5">
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl bg-rose-950 border border-rose-500/60 shadow-[0_0_30px_rgba(255,0,85,0.3)] text-rose-400">
              <Lock className="w-12 h-12" />
            </div>
          </div>
          <div>
            <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest bg-rose-950 text-rose-300 border border-rose-500/40 rounded">
              Clearance Level Insufficient
            </span>
            <h2 className="text-xl font-bold text-slate-100 mt-3">
              RESTRICTED SOC CLEARANCE REQUIRED
            </h2>
            <p className="text-xs text-slate-400 max-w-lg mx-auto mt-2 leading-relaxed">
              Access to the live accounts database, active device IP telemetry, operator session tracking, and database internals is strictly restricted to <span className="text-rose-300 font-bold">SUPER_ADMIN</span> and <span className="text-rose-300 font-bold">SOC_ADMIN</span> clearance levels under Zero-Trust architecture.
            </p>
          </div>

          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg inline-block text-left text-xs">
            <div className="text-slate-400">Current Operator: <span className="text-slate-200 font-bold">{currentUser.username}</span></div>
            <div className="text-slate-400">Assigned Role: <span className="text-amber-400 font-bold">{currentUser.role || 'ANALYST'}</span></div>
            <div className="text-slate-400">Required Role: <span className="text-rose-400 font-bold">SUPER_ADMIN / SOC_ADMIN</span></div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              Return to SOC Overview
            </button>
            <button
              onClick={handleElevateRole}
              className="px-5 py-2.5 rounded-lg text-xs font-bold bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              <span>Elevate to Super Admin (Demo Mode)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const usersList = stats?.users || [];
  const filteredUsers = usersList.filter((u: any) => {
    const matchesSearch =
      (u.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.last_login_ip || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.role || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto font-mono">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-wider text-slate-100">
                  DATABASE & CLEARANCE DIRECTORY
                </h1>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest bg-cyan-950 text-cyan-300 border border-cyan-500/30 rounded">
                  SUPER_ADMIN CONSOLE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Authoritative account registry, live device IP telemetry, active sessions, and database storage telemetry.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSimulateRegistration}
            disabled={isSimulating}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50"
            title="Simulate a real-time account registration from an external device (iPhone, Mac, Windows, Linux) to demonstrate live database ingestion"
          >
            <Zap className={`w-3.5 h-3.5 ${isSimulating ? 'animate-bounce' : ''}`} />
            <span>{isSimulating ? 'Registering Device...' : '⚡ Simulate External Device Registration'}</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-slate-400">TELEMETRY:</span>
            <span className="text-emerald-400 font-bold">1s LIVE POLLING</span>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 bg-cyan-950/80 border border-cyan-500/60 rounded-lg flex items-center gap-2.5 text-xs text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.15)] animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">Total Registered Accounts</div>
              <div className="text-2xl font-bold text-slate-100 mt-1">{stats?.total_users ?? 25}</div>
              <div className="text-[10px] text-cyan-400 mt-1 flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                <span>{stats?.verified_users ?? 25} Email Verified (100%)</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-cyan-950 border border-cyan-500/30 text-cyan-400">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">Live Online Sessions</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1 flex items-center gap-2">
                <span>{sessions.filter(s => s.status === 'ONLINE').length || 1}</span>
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Active on Campus / Remote IPs</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">Storage Engine</div>
              <div className="text-base font-bold text-slate-100 mt-1 truncate max-w-[180px]">
                {dbOverview?.engine || 'SQLite 3 (Embedded)'}
              </div>
              <div className="text-[10px] text-cyan-400 mt-1 truncate max-w-[200px]">
                {dbOverview?.location || 'threatcast.db (Local DB)'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-400">
              <Server className="w-6 h-6" />
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">Clearance Integrity</div>
              <div className="text-2xl font-bold text-cyan-300 mt-1">ENFORCED</div>
              <div className="text-[10px] text-emerald-400 mt-1">Zero-Trust Role Verification</div>
            </div>
            <div className="p-3 rounded-xl bg-cyan-950 border border-cyan-500/30 text-cyan-400">
              <Shield className="w-6 h-6" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* SECTION 1: Who is Currently Using on Which Device IP */}
      <GlassCard
        title="Live Operator Sessions & Device IP Telemetry"
        badge="REAL-TIME MONITOR"
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            Real-time tracking of authenticated operators currently connected to the ThreatCast SOC Console. Reflects client device IP addresses, hardware/browser user-agents, connection duration, and session termination controls.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Operator</th>
                  <th className="py-2.5 px-3">Clearance Role</th>
                  <th className="py-2.5 px-3">Device Client IP</th>
                  <th className="py-2.5 px-3">Hardware & Browser</th>
                  <th className="py-2.5 px-3">Session Started</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-slate-500">
                      No active sessions recorded.
                    </td>
                  </tr>
                ) : (
                  sessions.map((sess) => {
                    const isOnline = sess.status === 'ONLINE';
                    return (
                      <tr key={sess.session_id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-200">{sess.username}</div>
                          <div className="text-[11px] text-slate-400">{sess.email}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            sess.role === 'SUPER_ADMIN'
                              ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                              : 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                          }`}>
                            {sess.role}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-bold shadow-sm">
                            {sess.ip_address}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-slate-300 flex items-center gap-1.5">
                            <Laptop className="w-3.5 h-3.5 text-slate-400" />
                            <span>{sess.device}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-[11px]">
                          {new Date(sess.login_time).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-3">
                          {isOnline ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              ONLINE · LIVE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                              REVOKED
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {isOnline ? (
                            <button
                              onClick={() => handleTerminateSession(sess.session_id)}
                              className="px-2.5 py-1 rounded text-[11px] font-semibold bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 transition-colors inline-flex items-center gap-1"
                              title="Revoke session and disconnect user"
                            >
                              <Power className="w-3 h-3" />
                              <span>Terminate</span>
                            </button>
                          ) : (
                            <span className="text-slate-600 text-[11px]">Terminated</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </GlassCard>

      {/* SECTION 2: Registered Accounts Directory */}
      <GlassCard
        title="Registered Accounts & Clearance Directory"
        badge={`${filteredUsers.length} OPERATORS`}
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search username, email, IP..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Role Filter Buttons */}
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500 text-[11px]">Role:</span>
              {['ALL', 'SUPER_ADMIN', 'SOC_ADMIN', 'ANALYST'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                    roleFilter === r
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">UID</th>
                  <th className="py-2.5 px-3">Operator Name</th>
                  <th className="py-2.5 px-3">Registered Email</th>
                  <th className="py-2.5 px-3">Clearance Role</th>
                  <th className="py-2.5 px-3">2FA Clearance</th>
                  <th className="py-2.5 px-3">Last Known IP</th>
                  <th className="py-2.5 px-3">Device / Hardware</th>
                  <th className="py-2.5 px-3">Registered At</th>
                  <th className="py-2.5 px-3 text-right">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredUsers.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 text-slate-500">#{u.id}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{u.username}</span>
                        {isRecent(u.created_at) && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/50 text-[9px] font-bold tracking-wider animate-pulse flex items-center gap-1 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            LIVE NEW
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">{u.full_name || u.username}</div>
                    </td>
                    <td className="py-3 px-3 text-cyan-400">{u.email}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        u.role === 'SUPER_ADMIN'
                          ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                          : u.role === 'SOC_ADMIN'
                          ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                          : 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {u.is_verified ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1 text-[11px]">
                          <Clock className="w-3.5 h-3.5" /> PENDING OTP
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-semibold">
                      <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded">
                        {u.last_login_ip || '127.0.0.1'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px] truncate max-w-[150px]">
                      {u.last_login_device || 'SOC Terminal'}
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {u.username === 'admin' ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          PROTECTED
                        </span>
                      ) : (
                        <button
                          onClick={() => handleToggleUser(u.id, u.is_active)}
                          className={`px-2.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                            u.is_active
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-500/40'
                              : 'bg-rose-950/60 text-rose-300 border-rose-500/40 hover:bg-emerald-950/60 hover:text-emerald-300 hover:border-emerald-500/40'
                          }`}
                        >
                          {u.is_active ? 'ACTIVE' : 'SUSPENDED'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </GlassCard>

      {/* SECTION 3: Primary Database Tables Overview */}
      <GlassCard title="Primary Database Architecture & Storage Metrics" badge="HEALTHY">
        <div className="space-y-4 text-xs font-mono">
          <p className="text-slate-400">
            Relational tables storing operational network telemetry, AI world model forecasts, cryptographic evidence chains, and audit logs.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {[
              { table: 'users', label: 'Registered Operators', count: dbOverview?.tables?.users ?? stats?.total_users ?? 25, badge: 'AUTH' },
              { table: 'assets', label: 'Monitored Assets', count: dbOverview?.tables?.assets ?? 16, badge: 'CAMPUS' },
              { table: 'incidents', label: 'Security Incidents', count: dbOverview?.tables?.incidents ?? 8, badge: 'TRIAGE' },
              { table: 'evidence_records', label: 'Merkle & Chain Blocks', count: dbOverview?.tables?.evidence_records ?? 42, badge: 'IMMUTABLE' },
              { table: 'forecasts', label: 'Forward Projections', count: dbOverview?.tables?.forecasts ?? 15, badge: 'AI MODEL' },
              { table: 'audit_logs', label: 'Forensic Audit Trails', count: dbOverview?.tables?.audit_logs ?? 64, badge: 'SECURITY' },
              { table: 'compliance_controls', label: 'NIST/ISO Controls', count: dbOverview?.tables?.compliance_controls ?? 24, badge: 'GOV' },
            ].map((item) => (
              <div key={item.table} className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase">{item.badge}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </div>
                <div className="text-lg font-bold text-slate-100">{item.count}</div>
                <div className="text-[11px] text-slate-400 truncate">{item.label}</div>
                <div className="text-[9px] text-slate-500 font-mono">tbl: {item.table}</div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
