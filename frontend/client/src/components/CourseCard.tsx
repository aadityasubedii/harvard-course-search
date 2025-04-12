import { Course } from "@/types";

interface CourseCardProps {
  course: Course;
  onClick?: () => void;
}

export default function CourseCard({ course, onClick }: CourseCardProps) {
  // Function to render the star rating
  const renderStarRating = (rating: number | null) => {
    if (!rating) return null;
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex">
        {[...Array(fullStars)].map((_, i) => (
          <svg key={`full-${i}`} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        
        {hasHalfStar && (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
            <defs>
              <linearGradient id="half-gradient">
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="transparent" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path fill="url(#half-gradient)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )}
        
        {[...Array(emptyStars)].map((_, i) => (
          <svg key={`empty-${i}`} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        ))}
      </div>
    );
  };

  // Calculate workload percentage for the bar
  const workloadPercentage = course.workload 
    ? Math.min(Math.round((course.workload / 20) * 100), 100)
    : 0;

  return (
    <div 
      className="glass-panel rounded-lg border border-neutral-700/50 p-3 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer gradient-border"
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-white">{course.courseCode}: {course.title}</h3>
          <p className="text-sm text-neutral-400">Prof. {course.instructor}</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center space-x-1 text-sm">
            <span className="font-semibold text-primary glow-text">{course.qGuideRating?.toFixed(1) || "N/A"}</span>
            {course.qGuideRating && renderStarRating(course.qGuideRating)}
          </div>
          <span className="text-xs text-neutral-500">Q Guide Rating</span>
        </div>
      </div>
      
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-neutral-500">Workload</div>
          <div className="flex items-center space-x-2">
            <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full glow-border" 
                style={{ width: `${workloadPercentage}%` }}
              ></div>
            </div>
            <span className="text-xs font-medium text-neutral-300">
              {course.workload ? `${course.workload}hrs/wk` : 'N/A'}
            </span>
          </div>
        </div>
        <div>
          <div className="text-xs text-neutral-500">Class Size</div>
          <div className="text-sm">
            <span className="font-medium text-neutral-300">{course.classSize}</span>
            {course.classSizeNumber && (
              <span className="text-neutral-500">
                {" "}({course.classSizeNumber > 500 ? "500+" : course.classSizeNumber})
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/20 border border-primary/50 text-primary glow-border">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {course.timeSlot}
        </span>
        
        {course.genedCategory && (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-neutral-800/80 border border-neutral-700 text-neutral-300">
            GenEd: {course.genedCategory}
          </span>
        )}
        
        {course.tags?.map((tag, index) => (
          <span 
            key={index} 
            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-neutral-800/80 border border-neutral-700 text-neutral-300"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
