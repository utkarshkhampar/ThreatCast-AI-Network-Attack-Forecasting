import { create } from 'zustand';
import { ForecastData, FlowRecord, Incident } from '../types';

interface SocState {
  forecast: ForecastData | null;
  recentFlows: FlowRecord[];
  activeIncidents: Incident[];
  selectedHostIp: string;
  isWsConnected: boolean;
  activeDefenceMode: 'DRY_RUN' | 'SIMULATION' | 'LIVE';
  searchQuery: string;
  isSearchOpen: boolean;
  setForecast: (fc: ForecastData) => void;
  addFlow: (flow: FlowRecord) => void;
  setIncidents: (inc: Incident[]) => void;
  setSelectedHostIp: (ip: string) => void;
  setWsConnected: (connected: boolean) => void;
  setActiveDefenceMode: (mode: 'DRY_RUN' | 'SIMULATION' | 'LIVE') => void;
  setSearchQuery: (query: string) => void;
  setIsSearchOpen: (open: boolean) => void;
}

export const useSocStore = create<SocState>((set) => ({
  forecast: null,
  recentFlows: [],
  activeIncidents: [],
  selectedHostIp: '192.168.1.45',
  isWsConnected: false,
  activeDefenceMode: 'DRY_RUN',
  searchQuery: '',
  isSearchOpen: false,

  setForecast: (forecast) => set({ forecast }),
  addFlow: (flow) => set((state) => ({
    recentFlows: [flow, ...state.recentFlows.slice(0, 49)]
  })),
  setIncidents: (activeIncidents) => set({ activeIncidents }),
  setSelectedHostIp: (selectedHostIp) => set({ selectedHostIp }),
  setWsConnected: (isWsConnected) => set({ isWsConnected }),
  setActiveDefenceMode: (activeDefenceMode) => set({ activeDefenceMode }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setIsSearchOpen: (isSearchOpen) => set({ isSearchOpen })
}));
