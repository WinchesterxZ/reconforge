import { create } from 'zustand';
import type { AppView } from './types';

interface AppState {
  currentView: AppView;
  selectedProjectId: string | null;
  selectedScanId: string | null;
  sidebarCollapsed: boolean;
  setView: (view: AppView) => void;
  selectProject: (id: string | null) => void;
  selectScan: (id: string | null) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'dashboard',
  selectedProjectId: null,
  selectedScanId: null,
  sidebarCollapsed: false,

  setView: (view) => set({ currentView: view }),

  selectProject: (id) => set({ selectedProjectId: id }),

  selectScan: (id) => set({ selectedScanId: id }),

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
