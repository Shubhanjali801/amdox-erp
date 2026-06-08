import { create } from 'zustand';

interface tenantState {
  data:    any[];
  loading: boolean;
  error:   string | null;
  setData: (data: any[]) => void;
}

export const usetenantStore = create<tenantState>()(set => ({
  data:    [],
  loading: false,
  error:   null,
  setData: (data) => set({ data }),
}));
