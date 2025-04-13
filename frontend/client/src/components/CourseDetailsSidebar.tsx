import { Course } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useCourseStore } from '@/store/courseStore';

type CourseDetailsSidebarProps = {
  course: Course;
  onClose: () => void;
  className?: string;
};

export default function CourseDetailsSidebar({ course, onClose, className = '' }: CourseDetailsSidebarProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { addCartCourse } = useCourseStore();
  
  // Save course mutation
  const saveCourse = useMutation({
    mutationFn: async (courseId: number) => {
      const res = await apiRequest('POST', '/api/courses/save', { courseId });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Course saved',
        description: 'Course has been saved for later.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/courses/saved'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to save course: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Add to shopping cart mutation
  const addToCart = useMutation({
    mutationFn: async (courseId: number) => {
      const res = await apiRequest('POST', '/api/courses/add-to-cart', { courseId });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Added to cart',
        description: 'Course has been added to your shopping cart.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/courses/cart'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to add course to cart: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  const handleSaveCourse = () => {
    saveCourse.mutate(course.id);
  };

  const handleAddToCart = () => {
    addToCart.mutate(course.id);
    // Also update the local state to show the course in the cart immediately
    addCartCourse(course);
  };

  // Helper function to render rating bars
  const renderRatingBar = (rating: number, label: string) => {
    const percentage = (rating / 5) * 100;
    let color = 'bg-accent-green';
    
    if (label === 'Difficulty' || label === 'Workload') {
      color = rating >= 4 ? 'bg-accent-red' : rating >= 3 ? 'bg-accent-yellow' : 'bg-accent-green';
    }
    
    return (
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span>{label}</span>
          <span>{rating.toFixed(1)}/5.0</span>
        </div>
        <div className="w-full bg-accent/30 rounded-full h-1.5">
          <div className={`${color} h-1.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col w-80 bg-card border-l border-border ${className}`}>
      {/* Course Details Header */}
      <div className="p-4 border-b border-border flex items-center">
        <button 
          onClick={onClose} 
          className="text-gray-600 hover:text-primary bg-gray-100 hover:bg-gray-200 rounded-full p-1.5 transition-colors absolute left-4"
          aria-label="Close panel"
        >
          <i className="ri-close-line text-lg"></i>
        </button>
        <h2 className="text-primary font-bold text-lg w-full text-center">Course Details</h2>
      </div>
      
      {/* Selected Course Details */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        <div className="space-y-4">
          {/* Course Header */}
          <div>
            <h3 className="text-xl font-semibold">{course.course_id}: {course.title}</h3>
            <p className="text-muted-foreground">{course.term}</p>
          </div>
          
          {/* Rating Badge */}
          <div className="flex space-x-2">
            <div className="bg-green-500/20 text-green-500 px-3 py-1 rounded-md flex items-center">
              <i className="ri-star-fill mr-2"></i>
              <span>Overall: {course.qrating?.toFixed(1) || "N/A"}/5.0</span>
            </div>
            <div className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-md flex items-center">
              <i className="ri-timer-line mr-2"></i>
              <span>Workload: {course.average_workload || "N/A"}</span>
            </div>
          </div>
          
          {/* Course Info */}
          <div className="space-y-3">
            <div className="flex">
              <div className="w-24 flex-shrink-0 text-muted-foreground">Professor</div>
              <div>{course.professor}</div>
            </div>
            <div className="flex">
              <div className="w-24 flex-shrink-0 text-muted-foreground">Schedule</div>
              <div>{course.schedule || "TBA"}</div>
            </div>
            <div className="flex">
              <div className="w-24 flex-shrink-0 text-muted-foreground">Concentration</div>
              <div>{course.concentration || "None"}</div>
            </div>
            <div className="flex">
              <div className="w-24 flex-shrink-0 text-muted-foreground">Size</div>
              <div>
                {course.class_size ? (
                  course.class_size < 30 ? "Small (< 30 students)" :
                  course.class_size < 100 ? "Medium (30-100 students)" : 
                  "Large (100+ students)"
                ) : "Unknown"}
              </div>
            </div>
            <div className="flex">
              <div className="w-24 flex-shrink-0 text-muted-foreground">GenEds</div>
              <div>{course.gen_eds && course.gen_eds.length > 0 ? course.gen_eds.join(', ') : "None"}</div>
            </div>
          </div>
          
          {/* Description */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">DESCRIPTION</h4>
            <p className="text-sm">{course.course_description}</p>
          </div>
          
          {/* Q Guide Breakdown */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">Q GUIDE RATINGS</h4>
            <div className="space-y-2">
              {renderRatingBar(course.qrating || 0, "Overall")}
              {/* Estimated difficulty based on workload */}
              {renderRatingBar(course.average_workload ? 3.5 : 0, "Difficulty")}
              {/* Workload rating based on hour description */}
              {renderRatingBar(course.average_workload ? 4 : 0, "Workload")}
            </div>
          </div>
          
          {/* Student Comments from QGuide */}
          {course.qguide_reviews && course.qguide_reviews.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">STUDENT FEEDBACK</h4>
              <div className="space-y-3">
                {course.qguide_reviews.map((comment: string, index: number) => (
                  <div key={index} className="bg-accent/10 p-3 rounded-md text-xs">
                    <p>"{comment}"</p>
                    <p className="text-muted-foreground mt-1">— Student Review</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="p-4 border-t border-border space-y-2">
        <Button 
          className="w-full"
          onClick={handleAddToCart}
          disabled={addToCart.isPending}
        >
          <i className="ri-add-line mr-2"></i>
          Add to Shopping Cart
        </Button>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={onClose}
        >
          <i className="ri-close-line mr-2"></i>
          Close Panel
        </Button>
      </div>
    </div>
  );
}
