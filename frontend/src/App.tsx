import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { CommandPalette } from './components/layout/CommandPalette';

// Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { LiveMonitoring } from './pages/LiveMonitoring';
import { AttackForecast } from './pages/AttackForecast';
import { NetworkGraph } from './pages/NetworkGraph';
import { Incidents } from './pages/Incidents';
import { ExplainableAI } from './pages/ExplainableAI';
import { MitreMatrix } from './pages/MitreMatrix';
import { Ueba } from './pages/Ueba';
import { ThreatIntel } from './pages/ThreatIntel';
import { CounterfactualSimulation } from './pages/CounterfactualSimulation';
import { ActiveDefence } from './pages/ActiveDefence';
import { EvidenceLedger } from './pages/EvidenceLedger';
import { Assets } from './pages/Assets';
import { Analytics } from './pages/Analytics';
import { Compliance } from './pages/Compliance';
import { AiModels } from './pages/AiModels';
import { AuditLogs } from './pages/AuditLogs';
import { Settings } from './pages/Settings';

const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[#0B0F19]">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
    </div>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        
        {/* Authenticated SOC Console Routes */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/monitoring" element={<LiveMonitoring />} />
          <Route path="/forecast" element={<AttackForecast />} />
          <Route path="/graph" element={<NetworkGraph />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/xai" element={<ExplainableAI />} />
          <Route path="/mitre" element={<MitreMatrix />} />
          <Route path="/ueba" element={<Ueba />} />
          <Route path="/threat-intel" element={<ThreatIntel />} />
          <Route path="/simulation" element={<CounterfactualSimulation />} />
          <Route path="/response" element={<ActiveDefence />} />
          <Route path="/blockchain" element={<EvidenceLedger />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/models" element={<AiModels />} />
          <Route path="/audit" element={<AuditLogs />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
