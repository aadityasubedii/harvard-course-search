type FilterTagProps = {
  name: string;
  value: any;
  onRemove: () => void;
};

export default function FilterTag({ name, value, onRemove }: FilterTagProps) {
  // Format the filter value for display
  const formatFilterValue = () => {
    if (typeof value === 'boolean') {
      return name;
    }
    
    // Handle special cases
    if (name === 'difficultyRating' || name === 'workloadRating') {
      return `${name.replace('Rating', '')} > ${value}`;
    }
    
    return `${name}: ${value}`;
  };

  // Get appropriate icon for the filter
  const getFilterIcon = () => {
    switch (name) {
      case 'concentration':
        return 'ri-book-open-line';
      case 'genedCategory':
        return 'ri-medal-line';
      case 'difficultyRating':
      case 'qRating':
        return 'ri-star-line';
      case 'workloadRating':
        return 'ri-timer-line';
      case 'morning':
      case 'afternoon':
      case 'evening':
      case 'noFriday':
        return 'ri-time-line';
      case 'classSize':
        return 'ri-group-line';
      case 'professor':
        return 'ri-user-settings-line';
      default:
        return 'ri-filter-3-line';
    }
  };

  return (
    <div className="filter-tag group flex items-center bg-accent/10 text-sm px-3 py-1 rounded-full">
      <i className={`${getFilterIcon()} mr-1.5 text-primary text-xs`}></i>
      <span>{formatFilterValue()}</span>
      <button 
        className="filter-close hidden ml-2 bg-background rounded-full w-4 h-4 items-center justify-center group-hover:flex"
        onClick={onRemove}
      >
        <i className="ri-close-line text-xs"></i>
      </button>
    </div>
  );
}
