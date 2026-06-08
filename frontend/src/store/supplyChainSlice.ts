import { create } from 'zustand';

interface supplyChainState {
  data:    any[];
  loading: boolean;
  error:   string | null;
  setData: (data: any[]) => void;
}

export const usesupplyChainStore = create<supplyChainState>()(set => ({
  data:    [],
  loading: false,
  error:   null,
  setData: (data) => set({ data }),
}));
