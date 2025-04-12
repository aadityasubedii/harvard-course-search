import { Course } from '@shared/schema';
import { useCourseStore } from '@/store/courseStore';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

type CourseCardProps = {
  course: Course;
  onClick: () => void;
};

export default function CourseCard({ course, onClick }: CourseCardProps) {
  const { addCartCourse, addSavedCourse } = useCourseStore();
  const { toast } = useToast();
  // Helper for formatting Q ratings with color coding
  const formatQRating = (rating: number | null) => {
    if (!rating) return null;
    
    let bgColor = 'bg-green-500/20 text-green-500';
    if (rating < 3) bgColor = 'bg-red-500/20 text-red-500';
    else if (rating < 4) bgColor = 'bg-yellow-500/20 text-yellow-500';
    
    return (
      <div className={`flex items-center ${bgColor} px-2 py-0.5 rounded text-xs`}>
        <i className="ri-star-fill mr-1"></i>
        <span>{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Helper for formatting class size
  const formatClassSize = (size: number | null) => {
    if (!size) return "Unknown";
    
    if (size < 30) return "Small (< 30)";
    if (size < 100) return "Medium (30-100)";
    return "Large (100+)";
  };

  // Helper for formatting workload
  const formatWorkload = (hours: number | null) => {
    if (!hours) return "Unknown";
    
    if (hours < 5) return "Light";
    if (hours < 10) return "Medium";
    return "Heavy";
  };
  
  // Handle adding to cart
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click from triggering
    
    try {
      await apiRequest(
        'POST',
        '/api/courses/add-to-cart',
        { courseId: course.id }
      );
      
      // Update local state
      addCartCourse(course);
      
      toast({
        title: 'Course Added',
        description: `${course.courseCode} has been added to your cart.`,
      });
    } catch (error) {
      console.error('Failed to add course to cart:', error);
      toast({
        title: 'Error',
        description: 'Failed to add course to cart.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle saving for later
  const handleSaveForLater = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click from triggering
    
    try {
      await apiRequest(
        'POST',
        '/api/courses/save',
        { courseId: course.id }
      );
      
      // Update local state
      addSavedCourse(course);
      
      toast({
        title: 'Course Saved',
        description: `${course.courseCode} has been saved for later.`,
      });
    } catch (error) {
      console.error('Failed to save course:', error);
      toast({
        title: 'Error',
        description: 'Failed to save course for later.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div 
      className="course-card bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex flex-col sm:flex-row">
        <div className="p-4 flex-1">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-medium text-gray-900">{course.courseCode}: {course.title}</h3>
            {formatQRating(course.qRating)}
          </div>
          
          <p className="text-sm text-gray-600 mt-1 flex items-center">
            <i className="ri-user-line mr-1.5 text-primary/70 text-xs"></i>
            {course.professor}
          </p>
          
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs bg-gray-100 px-2.5 py-1 rounded-md flex items-center">
              <i className="ri-time-line mr-1.5 text-primary/70"></i>
              {course.schedule || "Schedule TBD"}
            </span>
            <span className="text-xs bg-gray-100 px-2.5 py-1 rounded-md flex items-center">
              <i className="ri-group-line mr-1.5 text-primary/70"></i>
              {formatClassSize(course.classSize)}
            </span>
            <span className="text-xs bg-gray-100 px-2.5 py-1 rounded-md flex items-center">
              <i className="ri-time-line mr-1.5 text-primary/70"></i>
              {formatWorkload(course.workloadHours)}
            </span>
          </div>
          
          <p className="text-xs mt-3 text-gray-600 line-clamp-2">{course.description}</p>
        </div>
        
        <div className="bg-gray-50 p-3 flex flex-row sm:flex-col justify-around items-center gap-3 sm:w-24 border-t sm:border-t-0 sm:border-l border-gray-200">
          <button 
            className="text-primary hover:text-primary/80 p-1.5 rounded-full hover:bg-white transition-colors"
            onClick={onClick}
            aria-label="View course details"
          >
            <i className="ri-information-line text-lg"></i>
          </button>
          <button 
            className="text-gray-500 hover:text-primary p-1.5 rounded-full hover:bg-white transition-colors"
            onClick={handleSaveForLater}
            aria-label="Save course for later"
          >
            <i className="ri-bookmark-line text-lg"></i>
          </button>
          <button 
            className="text-gray-500 hover:text-primary p-1.5 rounded-full hover:bg-white transition-colors"
            onClick={handleAddToCart}
            aria-label="Add course to cart"
          >
            <i className="ri-add-line text-lg"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
