import { useCourseStore } from '@/store/courseStore';
import { Button } from '@/components/ui/button';
import { Course } from '@shared/schema';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

type CartSidebarProps = {
  onClose: () => void;
  onSelectCourse: (course: Course) => void;
  className?: string;
};

export default function CartSidebar({ onClose, onSelectCourse, className = '' }: CartSidebarProps) {
  const { cartCourses, removeCartCourse } = useCourseStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calculate total credits (default to 4 if not specified)
  const totalCredits = cartCourses.reduce((sum, course) => sum + (course.credits ?? 4), 0);

  // Remove from cart mutation
  const removeFromCart = useMutation({
    mutationFn: async (courseId: number) => {
      try {
        // Instead of sending data in the body for a DELETE request, add the courseId to the URL as a query parameter
        await apiRequest('DELETE', `/api/courses/cart?courseId=${courseId}`);
        // Just return the courseId as we don't need to parse the response
        return courseId;
      } catch (error) {
        console.error("Error removing course:", error);
        throw error;
      }
    },
    onSuccess: (courseId) => {
      // Directly update the local store to remove the course
      removeCartCourse(courseId);
      toast({
        title: 'Course removed',
        description: 'Course has been removed from your cart.',
      });
      // No need to invalidate the query as we're using local state
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to remove course. Please try again.',
        variant: 'destructive'
      });
    }
  });

  const handleRemoveFromCart = (courseId: number) => {
    removeFromCart.mutate(courseId);
  };

  const handleViewCourse = (course: Course) => {
    onSelectCourse(course);
  };
  
  const handleExportSchedule = () => {
    if (cartCourses.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Please add courses to your cart before exporting.',
        variant: 'destructive'
      });
      return;
    }
    
    // Use a direct path to the calendar file without query parameters
    window.open('/download-calendar.ics', '_blank');
    
    toast({
      title: 'Schedule Exported',
      description: 'Your course schedule has been exported in Google Calendar format (.ics).',
    });
  };

  return (
    <div className={`flex flex-col w-80 bg-card border-l border-border ${className}`}>
      {/* Cart Header */}
      <div className="p-4 border-b border-border flex items-center">
        <button 
          onClick={onClose} 
          className="text-gray-600 hover:text-primary bg-gray-100 hover:bg-gray-200 rounded-full p-1.5 transition-colors absolute left-4"
          aria-label="Close cart"
        >
          <i className="ri-close-line text-lg"></i>
        </button>
        <h2 className="text-primary font-bold text-lg w-full text-center">Shopping Cart</h2>
      </div>
      
      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {cartCourses.length > 0 ? (
          <div className="space-y-4">
            {cartCourses.map(course => (
              <div key={course.id} className="bg-background rounded-md border border-border p-3">
                <div className="flex justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{course.courseCode}</h3>
                    <p className="text-xs text-muted-foreground truncate">{course.title}</p>
                    <div className="flex items-center mt-1 space-x-2">
                      <div className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-sm">
                        {course.credits ?? 4} credits
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {course.professor}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveFromCart(course.id)}
                    className="text-muted-foreground hover:text-destructive p-1"
                    disabled={removeFromCart.isPending}
                  >
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
                <div className="mt-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => handleViewCourse(course)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <i className="ri-shopping-cart-line text-4xl text-muted-foreground mb-2"></i>
            <p className="text-muted-foreground">Your cart is empty</p>
            <p className="text-xs text-muted-foreground mt-1">Add courses from the chat interface</p>
          </div>
        )}
      </div>
      
      {/* Cart Summary */}
      {cartCourses.length > 0 && (
        <div className="p-4 border-t border-border">
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm">Total Courses:</span>
              <span className="text-sm font-medium">{cartCourses.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Total Credits:</span>
              <span className="text-sm font-medium">{totalCredits}</span>
            </div>
          </div>
          
          <Button 
            className="w-full"
            onClick={handleExportSchedule}
          >
            <i className="ri-download-line mr-2"></i>
            Export to Google Calendar
          </Button>
        </div>
      )}
    </div>
  );
}