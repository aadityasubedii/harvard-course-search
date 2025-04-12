import { useState, useRef } from "react";
import Header from "@/components/Header";
import FilterSidebar from "@/components/FilterSidebar";
import ChatInterface from "@/components/ChatInterface";
import MobileFilterPanel from "@/components/MobileFilterPanel";
import { useFilters } from "@/hooks/useFilters";
import { useCourses } from "@/hooks/useCourses";
import { useChatbot } from "@/hooks/useChatbot";
import { CourseFilters } from "@/types";

export default function Home() {
  const { 
    filters, 
    updateFilter, 
    clearFilter, 
    clearAllFilters,
    updateFilterFromChatbot
  } = useFilters();
  
  const { getFilteredCourses } = useCourses();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatStarted, setChatStarted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Track if filters have been applied to fetch filtered courses
  const [filtersApplied, setFiltersApplied] = useState(false);
  
  // Get filtered courses when filters are applied
  const filteredCoursesQuery = getFilteredCourses(filters);
  
  const { sendMessage, isSending } = useChatbot();
  
  const handleApplyFilters = () => {
    setFiltersApplied(true);
    // Close mobile filters if open
    setShowMobileFilters(false);
  };
  
  const handleFilterSuggestions = (suggestions: Record<string, any>) => {
    updateFilterFromChatbot(suggestions);
    // Automatically apply filters if there are suggestions
    if (Object.keys(suggestions).length > 0) {
      setFiltersApplied(true);
    }
  };

  const startChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || isSending) return;

    // Set the chat as started to transition to chat interface
    setChatStarted(true);
    
    try {
      await sendMessage(searchQuery.trim());
      setSearchQuery(""); // Clear input after sending
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="bg-white font-sans min-h-screen text-neutral-800">
      <Header />
      
      {!chatStarted ? (
        <main className="container mx-auto px-4 py-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              <span className="text-neutral-900">Harvard</span>
              <span className="text-primary"> Course</span>
              <span className="text-neutral-900">GPT</span>
            </h1>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Your AI-powered assistant for finding the perfect Harvard courses tailored to your interests and requirements.
            </p>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Filters */}
            <div className="lg:w-64 xl:w-80 shrink-0">
              <div className="glass-panel rounded-xl p-4 sticky top-4 gradient-border">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-white">Filters</h3>
                  <button 
                    className="text-xs text-primary hover:text-primary/80 flex items-center"
                    onClick={clearAllFilters}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Reset All
                  </button>
                </div>
                
                <div className="space-y-5">
                  {/* Concentration Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-300">Concentration</label>
                    <div className="relative">
                      <select 
                        className="w-full glass-input rounded-lg py-1.5 px-2.5 appearance-none text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/60 text-white"
                        value={filters.concentration || ""}
                        onChange={(e) => updateFilter("concentration", e.target.value || undefined)}
                      >
                        <option value="">All Concentrations</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Economics">Economics</option>
                        <option value="Government">Government</option>
                        <option value="History">History</option>
                        <option value="Psychology">Psychology</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Semester Selection */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-300">Semester</label>
                    <div className="relative">
                      <select 
                        className="w-full glass-input rounded-lg py-1.5 px-2.5 appearance-none text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/60 text-white"
                        value={filters.semester || ""}
                        onChange={(e) => updateFilter("semester", e.target.value || undefined)}
                      >
                        <option value="">Any Semester</option>
                        <option value="Fall 2024">Fall 2024</option>
                        <option value="Spring 2025">Spring 2025</option>
                        <option value="Fall 2025">Fall 2025</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* GenEd Checkboxes */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-300">GenEd Category</label>
                    <div className="space-y-1">
                      {["Aesthetics & Culture", "Ethics & Civics", "Science & Technology", "Societies of the World"].map((category) => (
                        <label key={category} className="flex items-center space-x-2 text-xs">
                          <input 
                            type="checkbox" 
                            className="rounded text-primary focus:ring-primary bg-neutral-800 h-3.5 w-3.5"
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
                  
                  {/* Difficulty Slider */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-300">Difficulty (Q Guide)</label>
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
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="text-xs text-neutral-400 text-center">
                        {filters.difficulty?.max === 5 ? "Any difficulty" : `Max ${filters.difficulty?.max}`}
                      </div>
                    </div>
                  </div>
                  
                  {/* Class Size Buttons */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-300">Class Size</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {["Small", "Medium", "Large"].map((size) => (
                        <button 
                          key={size}
                          className={`text-xs py-1 rounded-lg border transition-colors ${
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
                  
                  {/* Workload Range */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-300">Workload (hrs/week)</label>
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
                        className="w-14 glass-input rounded-lg py-1 px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/60 text-white"
                      />
                      <span className="text-neutral-500 text-xs">to</span>
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
                        className="w-14 glass-input rounded-lg py-1 px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/60 text-white"
                      />
                    </div>
                  </div>
                  
                  {/* Time Slots */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-300">Time Slot</label>
                    <div className="grid grid-cols-2 gap-y-1 gap-x-1.5">
                      {["Morning", "Afternoon", "Evening", "No Conflict"].map((slot) => (
                        <label key={slot} className="flex items-center space-x-1.5 text-xs">
                          <input 
                            type="checkbox" 
                            className="rounded text-primary focus:ring-primary bg-neutral-800 h-3.5 w-3.5"
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
                  
                  {/* Instructor Search */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-300">Instructor</label>
                    <input 
                      type="text" 
                      placeholder="Enter professor name..." 
                      value={filters.instructor || ""}
                      onChange={(e) => updateFilter("instructor", e.target.value || undefined)}
                      className="w-full glass-input rounded-lg py-1.5 px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/60 text-white"
                    />
                  </div>
                  
                  {/* Action Button */}
                  <button 
                    onClick={handleApplyFilters}
                    className="w-full mt-2 bg-primary/20 border border-primary/50 text-white rounded-lg py-2 px-4 text-sm font-medium hover:bg-primary/30 hover:border-primary transition-all duration-200 glow-border gradient-border flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                    </svg>
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
            
            {/* Main Content Area */}
            <div className="flex-grow max-w-3xl mx-auto w-full">
              <form onSubmit={startChat} className="w-full mb-8">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ask about courses, requirements, or specific interests..."
                    className="w-full py-4 pl-6 pr-16 rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 text-white transition-all duration-200"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!searchQuery.trim() || isSending}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-3 rounded-lg transition-colors ${
                      !searchQuery.trim() || isSending
                        ? 'text-neutral-500 cursor-not-allowed'
                        : 'text-primary hover:text-white hover:bg-primary/20'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </button>
                </div>
                
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <p className="text-neutral-500 text-sm col-span-full mb-1">Popular searches:</p>
                  {["Computer Science courses", "Easy GenEd classes", "Small seminars", "Advanced Economics"].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        setSearchQuery(suggestion);
                        setTimeout(() => {
                          if (inputRef.current) inputRef.current.focus();
                        }, 100);
                      }}
                      className="text-sm py-1.5 px-2.5 rounded-lg gradient-border bg-neutral-800/50 text-neutral-300 hover:text-white hover:bg-neutral-700/50 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </form>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
                <div className="frosted-glass p-5 rounded-xl">
                  <div className="text-primary mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 16v-4"></path>
                      <path d="M12 8h.01"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-2">Smart Recommendations</h3>
                  <p className="text-sm text-neutral-400">Get personalized course suggestions based on your academic interests and career goals.</p>
                </div>
                
                <div className="frosted-glass p-5 rounded-xl">
                  <div className="text-primary mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-2">Q Guide Insights</h3>
                  <p className="text-sm text-neutral-400">Access real student ratings on workload, difficulty, and teaching quality for each course.</p>
                </div>
                
                <div className="frosted-glass p-5 rounded-xl">
                  <div className="text-primary mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-2">Requirement Tracking</h3>
                  <p className="text-sm text-neutral-400">Easily find courses that fulfill your concentration and GenEd requirements.</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filter sidebar - visible on large screens */}
            <FilterSidebar 
              filters={filters}
              updateFilter={updateFilter}
              clearFilter={clearFilter}
              applyFilters={handleApplyFilters}
              className="hidden lg:block"
            />
            
            {/* Chat interface */}
            <ChatInterface 
              onFilterSuggestions={handleFilterSuggestions}
              openMobileFilters={() => setShowMobileFilters(true)}
            />
          </div>
        </main>
      )}
      
      {/* Mobile filter panel */}
      <MobileFilterPanel 
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        filters={filters}
        updateFilter={updateFilter}
        clearFilter={clearFilter}
        applyFilters={handleApplyFilters}
      />
    </div>
  );
}