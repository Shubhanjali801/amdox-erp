import { create } from 'zustand';
import { Employee } from '../types/hr';

interface HrState {
  employees: Employee[];
  selectedEmployee: Employee | null;
  setEmployees: (employees: Employee[]) => void;
  setSelectedEmployee: (employee: Employee | null) => void;
}

export const useHrStore = create<HrState>()(set => ({
  employees: [],
  selectedEmployee: null,
  setEmployees: employees => set({ employees }),
  setSelectedEmployee: employee => set({ selectedEmployee: employee }),
}));

export const usehrStore = useHrStore;
