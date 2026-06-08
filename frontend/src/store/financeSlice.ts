import { create } from 'zustand';

interface financeState {
  data:    any[];
  loading: boolean;
  error:   string | null;
  setData: (data: any[]) => void;
}

export const usefinanceStore = create<financeState>()(set => ({
  data:    [],
  loading: false,
  error:   null,
  setData: (data) => set({ data }),
}));
