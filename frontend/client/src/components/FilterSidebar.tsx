import { useFilters } from "@/hooks/useFilters";
import { CourseFilters } from "@/types";

interface FilterSidebarProps {
  filters: CourseFilters;
  updateFilter: <K extends keyof CourseFilters>(key: K, value: CourseFilters[K]) => void;
  clearFilter: (key: keyof CourseFilters) => void;
  applyFilters: () => void;
  className?: string;
}

export default function FilterSidebar({ 
  filters, 
  updateFilter, 
  clearFilter, 
  applyFilters,
  className = "" 
}: FilterSidebarProps) {
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

  return (
    <aside className={`lg:col-span-1 glass-panel p-4 rounded-xl h-[calc(100vh-7rem)] sticky top-20 overflow-y-auto ${className} gradient-border`}>
      <div className="space-y-5">
        <div className="pb-3 border-b border-neutral-700/50">
          <h3 className="font-display text-lg font-medium text-white">Filters</h3>
          <p className="text-sm text-neutral-400 mt-1">Refine your course search</p>
        </div>

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
              className="w-full glass-input rounded-lg py-2 px-3 appearance-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 text-white"
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

        {/* GenEd Category Filter */}
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
          <div className="space-y-1">
            {genedCategories.map((category) => (
              <label key={category} className="flex items-center space-x-2 text-sm">
                <input 
                  type="checkbox" 
                  className="rounded text-primary focus:ring-primary bg-neutral-800"
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

        {/* Class Size Filter */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-neutral-300">Class Size</h4>
          <div className="grid grid-cols-3 gap-2">
            {["Small", "Medium", "Large"].map((size) => (
              <button 
                key={size}
                className={`text-xs py-1.5 rounded-lg border transition-colors ${
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

        {/* Workload Filter */}
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
              className="w-16 glass-input rounded-lg py-1.5 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 text-white"
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
              className="w-16 glass-input rounded-lg py-1.5 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 text-white"
            />
          </div>
        </div>

        {/* Time Slot Filter */}
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
          <div className="grid grid-cols-2 gap-2">
            {["Morning", "Afternoon", "Evening", "No Conflict"].map((slot) => (
              <label key={slot} className="flex items-center space-x-2 text-xs">
                <input 
                  type="checkbox" 
                  className="rounded text-primary focus:ring-primary bg-neutral-800"
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

        {/* Apply Button */}
        <button 
          className="w-full bg-primary/20 border border-primary/50 text-white rounded-lg py-2.5 font-medium hover:bg-primary/30 hover:border-primary transition-all duration-200 glow-border"
          onClick={applyFilters}
        >
          Apply Filters
        </button>
      </div>
    </aside>
  );
}
