import { create } from 'zustand';
import { FilterState, Filter } from '@/lib/types';

export const useFilterStore = create<FilterState>((set) => ({
  filters: {},
  
  setFilter: (key: string, value: any) => set((state) => ({
    filters: {
      ...state.filters,
      [key]: value
    }
  })),
  
  removeFilter: (key: string) => set((state) => {
    const newFilters = { ...state.filters };
    delete newFilters[key];
    return { filters: newFilters };
  }),
  
  resetFilters: () => set({ filters: {} })
}));
