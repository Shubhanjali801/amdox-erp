import { create } from 'zustand';

interface hrState {
  data:    any[];
  loading: boolean;
  error:   string | null;
  setData: (data: any[]) => void;
}

export const usehrStore = create<hrState>()(set => ({
  data:    [],
  loading: false,
  error:   null,
  setData: (data) => set({ data }),
}));
