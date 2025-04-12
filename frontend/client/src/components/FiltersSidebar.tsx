import { useEffect, useState } from 'react';
import { useFilterStore } from '@/store/filterStore';
import FilterTag from '@/components/FilterTag';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

type FiltersSidebarProps = {
  className?: string;
  onClose?: () => void;
};

export default function FiltersSidebar({ className = '', onClose }: FiltersSidebarProps) {
  const { filters, setFilter, removeFilter, resetFilters } = useFilterStore();

  // Use provided concentrations instead of fetching
  const concentrations = [
    "African and African American Studies",
    "Anthropology",
    "Applied Math",
    "Art, Film, and Visual Studies",
    "Astrophysics",
    "Biomedical Engineering",
    "Chemical and Physical Biology",
    "Chemistry",
    "Chemistry and Physics",
    "Classics",
    "Comparative Literature",
    "Comparative Study of Religion",
    "Computer Science",
    "Earth and Planetary Sciences",
    "East Asian Studies",
    "Economics",
    "Electrical Engineering",
    "Engineering Sciences",
    "English",
    "Environmental Science and Engineering",
    "Environmental Science and Public Policy",
    "Folklore and Mythology",
    "Germanic Languages and Literature",
    "Government",
    "History",
    "History and Literature",
    "History and Science",
    "History of Art and Architecture",
    "Human Developmental and Regenerative Biology",
    "Human Evolutionary Biology",
    "Integrative Biology",
    "Linguistics",
    "Material Science and Mechanical Engineering",
    "Mathematics",
    "Molecular and Cellular Biology",
    "Music",
    "Near Eastern Languages and Civilizations",
    "Neuroscience",
    "Philosophy",
    "Physics",
    "Psychology",
    "Romance Languages and Literature",
    "Slavic Literatures and Cultures",
    "Social Studies",
    "Sociology",
    "South Asian Studies",
    "Statistics",
    "Studies of Women, Gender, and Sexuality",
    "Theater, Dance & Media"
  ];

  // Use provided GenEd categories instead of fetching
  const genedCategories = [
    "Aesthetics & Culture", 
    "Ethics & Civics", 
    "Histories, Societies, Individuals", 
    "Science & Technology in Society"
  ];

  // Handles slider value changes
  const handleSliderChange = (name: string, value: number[]) => {
    setFilter(name, value[0]);
  };

  // Handle checkbox changes
  const handleCheckboxChange = (name: string, checked: boolean | 'indeterminate') => {
    if (typeof checked === 'boolean') {
      setFilter(name, checked);
    }
  };

  // Handle class size radio change
  const handleClassSizeChange = (value: string) => {
    setFilter('classSize', value);
  };

  // Handle concentration selection
  const handleConcentrationSelect = (concentration: string) => {
    setFilter('concentration', concentration);
  };

  // Handle GenEd category selection
  const handleGenEdSelect = (category: string) => {
    setFilter('genedCategory', category);
  };

  return (
    <div className={`md:flex flex-col w-72 bg-gray-50 p-5 border-r border-gray-200 ${className}`}>
      <div className="mb-5 relative">
        {/* Close button positioned absolutely */}
        {onClose && (
          <button onClick={onClose} className="md:hidden absolute right-0 top-0 text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-md">
            <i className="ri-close-line text-lg"></i>
          </button>
        )}
        
        {/* Centered Filters heading */}
        <div className="flex justify-center items-center py-2">
          <h2 className="text-2xl font-bold text-primary">Filters</h2>
        </div>
      </div>
      
      {/* Active Filters Section */}
      <div className="filter-section-accent mb-4">
        <h3 className="filter-heading">Active Filters</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => 
            value !== undefined && (
              <FilterTag 
                key={key} 
                name={key} 
                value={value} 
                onRemove={() => removeFilter(key)} 
              />
            )
          )}
          
          {/* Show "No filters applied" if no filters are active */}
          {Object.values(filters).every(v => v === undefined) && (
            <span className="text-sm text-gray-500">No filters applied</span>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-4">
        {/* Concentration Filter */}
        <div className="filter-section">
          <h3 className="filter-heading flex items-center">
            <i className="ri-book-open-line mr-2 text-primary/70"></i>
            Concentration
          </h3>
          <Select
            value={filters.concentration || undefined}
            onValueChange={handleConcentrationSelect}
          >
            <SelectTrigger className="w-full bg-white text-sm">
              <SelectValue placeholder="Select concentration" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectGroup>
                <SelectLabel>Concentrations</SelectLabel>
                {concentrations.map((concentration) => (
                  <SelectItem key={concentration} value={concentration} className="text-sm">
                    {concentration}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        
        {/* Gen Ed Category Filter */}
        <div className="filter-section">
          <h3 className="filter-heading flex items-center">
            <i className="ri-medal-line mr-2 text-primary/70"></i>
            Gen Ed Category
          </h3>
          <Select
            value={filters.genedCategory || undefined}
            onValueChange={handleGenEdSelect}
          >
            <SelectTrigger className="w-full bg-white text-sm">
              <SelectValue placeholder="Select GenEd category" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Gen Ed Categories</SelectLabel>
                {genedCategories.map((category) => (
                  <SelectItem key={category} value={category} className="text-sm">
                    {category}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        
        {/* Difficulty Rating Filter */}
        <div className="filter-section">
          <h3 className="filter-heading flex items-center">
            <i className="ri-star-line mr-2 text-primary/70"></i>
            Q Guide Rating
          </h3>
          <div className="px-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Difficulty</span>
              <span className="text-xs font-medium text-primary">{filters.difficultyRating || 3.5}+</span>
            </div>
            <Slider
              defaultValue={[filters.difficultyRating || 3.5]}
              max={5}
              min={1}
              step={0.5}
              onValueChange={(value) => handleSliderChange('difficultyRating', value)}
              className="my-2"
            />
            
            <div className="flex items-center justify-between mb-1 mt-4">
              <span className="text-xs text-gray-600">Workload</span>
              <span className="text-xs font-medium text-primary">{filters.workloadRating || 2.0}+</span>
            </div>
            <Slider
              defaultValue={[filters.workloadRating || 2.0]}
              max={5}
              min={1}
              step={0.5}
              onValueChange={(value) => handleSliderChange('workloadRating', value)}
              className="my-2"
            />
          </div>
        </div>
        
        {/* Time Slot Filter */}
        <div className="filter-section">
          <h3 className="filter-heading flex items-center">
            <i className="ri-time-line mr-2 text-primary/70"></i>
            Class Time
          </h3>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="morning" 
                checked={filters.morning === true}
                onCheckedChange={(checked) => handleCheckboxChange('morning', checked)}
              />
              <Label htmlFor="morning" className="text-sm text-gray-700">Morning</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="afternoon" 
                checked={filters.afternoon === true}
                onCheckedChange={(checked) => handleCheckboxChange('afternoon', checked)}
              />
              <Label htmlFor="afternoon" className="text-sm text-gray-700">Afternoon</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="evening" 
                checked={filters.evening === true}
                onCheckedChange={(checked) => handleCheckboxChange('evening', checked)}
              />
              <Label htmlFor="evening" className="text-sm text-gray-700">Evening</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="noFriday" 
                checked={filters.noFriday === true}
                onCheckedChange={(checked) => handleCheckboxChange('noFriday', checked)}
              />
              <Label htmlFor="noFriday" className="text-sm text-gray-700">No Friday</Label>
            </div>
          </div>
        </div>
        
        {/* Class Size Filter */}
        <div className="filter-section">
          <h3 className="filter-heading flex items-center">
            <i className="ri-group-line mr-2 text-primary/70"></i>
            Class Size
          </h3>
          <RadioGroup 
            value={filters.classSize || ""} 
            onValueChange={handleClassSizeChange}
            className="mt-2 space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="small" id="small" />
              <Label htmlFor="small" className="text-sm text-gray-700">Small (&lt;30)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medium" id="medium" />
              <Label htmlFor="medium" className="text-sm text-gray-700">Medium (30-100)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="large" id="large" />
              <Label htmlFor="large" className="text-sm text-gray-700">Large (100+)</Label>
            </div>
          </RadioGroup>
        </div>
        
        {/* Professor Filter */}
        <div className="filter-section">
          <h3 className="filter-heading flex items-center">
            <i className="ri-user-settings-line mr-2 text-primary/70"></i>
            Professor
          </h3>
          <div className="relative mt-2">
            <Input 
              type="text" 
              placeholder="Search professors..." 
              value={filters.professor || ""}
              onChange={(e) => setFilter('professor', e.target.value)}
              className="w-full text-sm bg-white border border-gray-200"
            />
            <i className="ri-search-line absolute right-3 top-2.5 text-gray-400"></i>
          </div>
        </div>
      </div>
      
      {/* Reset Filters Button */}
      <button 
        onClick={resetFilters}
        className="mt-4 flex items-center justify-center w-full text-sm text-gray-600 hover:text-primary font-medium py-2.5 border border-gray-200 rounded-md transition-colors hover:border-primary/30 hover:bg-gray-50"
      >
        <i className="ri-refresh-line mr-2"></i>
        Reset All Filters
      </button>
    </div>
  );
}
