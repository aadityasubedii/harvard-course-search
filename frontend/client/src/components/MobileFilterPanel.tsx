import { CourseFilters } from "@/types";
import { useEffect, useRef } from "react";

interface MobileFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: CourseFilters;
  updateFilter: <K extends keyof CourseFilters>(key: K, value: CourseFilters[K]) => void;
  clearFilter: (key: keyof CourseFilters) => void;
  applyFilters: () => void;
}

export default function MobileFilterPanel({ 
  isOpen, 
  onClose,
  filters,
  updateFilter,
  clearFilter,
  applyFilters
}: MobileFilterPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node) && isOpen) {
        onClose();
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isOpen]);

  // Popular concentrations
  const concentrations = [
    { value: "", label: "All Concentrations" },
    { value: "Computer Science", label: "Computer Science" },
    { value: "Economics", label: "Economics" },
    { value: "Government", label: "Government" },
    { value: "History", label: "History" },
    { value: "Psychology", label: "Psychology" },
  ];

  // GenEd categories
  const genedCategories = [
    "Aesthetics & Culture",
    "Ethics & Civics",
    "Science & Technology",
    "Societies of the World"
  ];

  if (!isOpen) return null;

  const handleApplyFilters = () => {
    applyFilters();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/80 backdrop-blur-sm z-50">
      <div 
        ref={panelRef}
        className="absolute bottom-0 left-0 right-0 glass-panel rounded-t-xl shadow-xl max-h-[80vh] overflow-y-auto gradient-border"
      >
        <div className="p-4 border-b border-neutral-700/50 sticky top-0 glass-panel z-10 flex justify-between items-center">
          <h3 className="font-display text-lg font-medium text-white">Filters</h3>
          <button 
            className="p-1 text-neutral-400 hover:text-primary"
            onClick={onClose}
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 space-y-5">
          {/* Concentration Filter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-neutral-300">Concentration</h4>
              <button 
                className="text-xs text-primary hover:text-primary/80"
                onClick={() => clearFilter("concentration")}
              >
                Clear
              </button>
            </div>
            <div className="relative">
              <select 
                className="w-full glass-input rounded-lg py-3 px-3 appearance-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 text-white"
                value={filters.concentration || ""}
                onChange={(e) => updateFilter("concentration", e.target.value || undefined)}
              >
                {concentrations.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* GenEd Category */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-neutral-300">GenEd Category</h4>
              <button 
                className="text-xs text-primary hover:text-primary/80"
                onClick={() => clearFilter("genedCategory")}
              >
                Clear
              </button>
            </div>
            <div className="space-y-2">
              {genedCategories.map((category) => (
                <label key={category} className="flex items-center space-x-3 text-sm p-1">
                  <input 
                    type="checkbox" 
                    className="rounded text-primary focus:ring-primary h-5 w-5 bg-neutral-800"
                    checked={filters.genedCategory?.includes(category) || false}
                    onChange={(e) => {
                      const current = filters.genedCategory || [];
                      if (e.target.checked) {
                        updateFilter("genedCategory", [...current, category]);
                      } else {
                        updateFilter("genedCategory", current.filter(c => c !== category));
                      }
                    }}
                  />
                  <span className="text-neutral-300">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Difficulty Filter */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-neutral-300">Difficulty (Q Guide)</h4>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>Easy</span>
                <span>Difficult</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="5" 
                step="0.5"
                value={filters.difficulty?.max || 5}
                onChange={(e) => {
                  updateFilter("difficulty", {
                    min: filters.difficulty?.min || 0,
                    max: parseFloat(e.target.value),
                  });
                }}
                className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="text-xs text-neutral-400 text-center">
                Selected: <span className="font-medium text-primary">
                  {filters.difficulty?.max === 5 ? "Any" : `Max ${filters.difficulty?.max}`}
                </span>
              </div>
            </div>
          </div>

          {/* Class Size */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-neutral-300">Class Size</h4>
            <div className="grid grid-cols-3 gap-2">
              {["Small", "Medium", "Large"].map((size) => (
                <button 
                  key={size}
                  className={`text-xs py-2 rounded-lg border transition-colors ${
                    filters.classSize?.includes(size)
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-neutral-700 bg-neutral-800/60 text-neutral-300 hover:bg-primary/10 hover:border-primary/30"
                  }`}
                  onClick={() => {
                    const current = filters.classSize || [];
                    if (current.includes(size)) {
                      updateFilter("classSize", current.filter(s => s !== size));
                    } else {
                      updateFilter("classSize", [...current, size]);
                    }
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Workload */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-neutral-300">Workload (hours/week)</h4>
            <div className="flex items-center space-x-2">
              <input 
                type="number" 
                min="0" 
                max="20" 
                value={filters.workload?.min || 0}
                onChange={(e) => {
                  updateFilter("workload", {
                    min: parseInt(e.target.value),
                    max: filters.workload?.max || 20,
                  });
                }}
                className="w-16 glass-input rounded-lg py-2 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 text-white"
              />
              <span className="text-neutral-500">to</span>
              <input 
                type="number" 
                min="0" 
                max="20" 
                value={filters.workload?.max || 20}
                onChange={(e) => {
                  updateFilter("workload", {
                    min: filters.workload?.min || 0,
                    max: parseInt(e.target.value),
                  });
                }}
                className="w-16 glass-input rounded-lg py-2 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 text-white"
              />
            </div>
          </div>

          {/* Time Slots */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-neutral-300">Time Slot</h4>
              <button 
                className="text-xs text-primary hover:text-primary/80"
                onClick={() => clearFilter("timeSlot")}
              >
                Clear
              </button>
            </div>
            <div className="grid grid-cols-2 gap-y-2">
              {["Morning", "Afternoon", "Evening", "No Conflict"].map((slot) => (
                <label key={slot} className="flex items-center space-x-3 text-sm p-1">
                  <input 
                    type="checkbox" 
                    className="rounded text-primary focus:ring-primary h-5 w-5 bg-neutral-800"
                    checked={filters.timeSlot?.includes(slot) || false}
                    onChange={(e) => {
                      const current = filters.timeSlot || [];
                      if (e.target.checked) {
                        updateFilter("timeSlot", [...current, slot]);
                      } else {
                        updateFilter("timeSlot", current.filter(s => s !== slot));
                      }
                    }}
                  />
                  <span className="text-neutral-300">{slot}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        
        {/* Apply Button */}
        <div className="sticky bottom-0 glass-panel py-3 border-t border-neutral-700/50 px-4">
          <button 
            className="w-full bg-primary/20 border border-primary/50 text-white rounded-lg py-3 font-medium hover:bg-primary/30 hover:border-primary transition-all duration-200 glow-border gradient-border"
            onClick={handleApplyFilters}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
