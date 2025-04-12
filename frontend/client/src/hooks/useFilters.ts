import { useState } from "react";
import { CourseFilters } from "@/types";

export function useFilters() {
  const [filters, setFilters] = useState<CourseFilters>({
    concentration: undefined,
    genedCategory: [],
    difficulty: { min: 0, max: 5 },
    workload: { min: 0, max: 20 },
    classSize: [],
    timeSlot: [],
    instructor: undefined,
    searchTerm: undefined,
    semester: undefined,
  });

  const updateFilter = <K extends keyof CourseFilters>(
    key: K,
    value: CourseFilters[K]
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilter = (key: keyof CourseFilters) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      
      switch (key) {
        case "genedCategory":
        case "classSize":
        case "timeSlot":
          newFilters[key] = [];
          break;
        case "difficulty":
          newFilters[key] = { min: 0, max: 5 };
          break;
        case "workload":
          newFilters[key] = { min: 0, max: 20 };
          break;
        default:
          newFilters[key] = undefined;
      }
      
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setFilters({
      concentration: undefined,
      genedCategory: [],
      difficulty: { min: 0, max: 5 },
      workload: { min: 0, max: 20 },
      classSize: [],
      timeSlot: [],
      instructor: undefined,
      searchTerm: undefined,
      semester: undefined,
    });
  };

  const updateFilterFromChatbot = (suggestions: Record<string, any>) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      
      Object.entries(suggestions).forEach(([key, value]) => {
        if (key in newFilters) {
          // @ts-ignore - we've already checked that the key exists
          newFilters[key] = value;
        }
      });
      
      return newFilters;
    });
  };

  return {
    filters,
    updateFilter,
    clearFilter,
    clearAllFilters,
    updateFilterFromChatbot,
  };
}
