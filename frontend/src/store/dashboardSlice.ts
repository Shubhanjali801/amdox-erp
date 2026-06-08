import { create } from 'zustand';

interface dashboardState {
  data:    any[];
  loading: boolean;
  error:   string | null;
  setData: (data: any[]) => void;
}

export const usedashboardStore = create<dashboardState>()(set => ({
  data:    [],
  loading: false,
  error:   null,
  setData: (data) => set({ data }),
}));
