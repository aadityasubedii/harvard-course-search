import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCourseStore } from '@/store/courseStore';
import { Course } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type SavedCoursesSidebarProps = {
  onClose: () => void;
  onSelectCourse: (course: Course) => void;
  className?: string;
};

export default function SavedCoursesSidebar({ onClose, onSelectCourse, className = '' }: SavedCoursesSidebarProps) {
  const { savedCourses, addCartCourse, removeSavedCourse } = useCourseStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch saved courses from the server
  const { isLoading, data } = useQuery<Course[]>({
    queryKey: ['/api/courses/saved'],
    queryFn: async () => {
      const response = await fetch('/api/courses/saved');
      if (!response.ok) {
        throw new Error('Failed to fetch saved courses');
      }
      return response.json();
    }
  });
  
  // Update local state when data is fetched
  useEffect(() => {
    if (data) {
      // Update local state with the fetched courses
      data.forEach(course => useCourseStore.getState().addSavedCourse(course));
    }
  }, [data]);
  
  // Remove course from saved courses
  const removeFromSaved = useMutation({
    mutationFn: async (courseId: number) => {
      const response = await apiRequest(
        'DELETE',
        `/api/courses/saved?courseId=${courseId}`
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses/saved'] });
    }
  });
  
  // Add course to cart
  const addToCart = useMutation({
    mutationFn: async (courseId: number) => {
      const response = await apiRequest(
        'POST',
        '/api/courses/add-to-cart',
        { courseId }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses/cart'] });
    }
  });
  
  const handleViewCourse = (course: Course) => {
    onSelectCourse(course);
    onClose();
  };
  
  const handleRemoveFromSaved = async (courseId: number) => {
    try {
      await removeFromSaved.mutateAsync(courseId);
      
      // Update local state
      removeSavedCourse(courseId);
      
      toast({
        title: 'Course Removed',
        description: 'Course has been removed from your saved list.',
      });
    } catch (error) {
      console.error('Failed to remove course from saved list:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove course from saved list.',
        variant: 'destructive',
      });
    }
  };
  
  const handleAddToCart = async (course: Course) => {
    try {
      await addToCart.mutateAsync(course.id);
      
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

  return (
    <div className={`flex flex-col w-80 bg-card border-l border-border ${className}`}>
      {/* Saved Courses Header */}
      <div className="p-4 border-b border-border flex items-center">
        <button 
          onClick={onClose} 
          className="text-gray-600 hover:text-primary bg-gray-100 hover:bg-gray-200 rounded-full p-1.5 transition-colors absolute left-4"
          aria-label="Close saved courses"
        >
          <i className="ri-close-line text-lg"></i>
        </button>
        <h2 className="text-primary font-bold text-lg w-full text-center">Saved Courses</h2>
      </div>
      
      {/* Saved Courses Items */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : savedCourses.length > 0 ? (
          <div className="space-y-4">
            {savedCourses.map(course => (
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
                    onClick={() => handleRemoveFromSaved(course.id)}
                    className="text-muted-foreground hover:text-destructive p-1"
                    disabled={removeFromSaved.isPending}
                  >
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
                <div className="mt-2 flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1 text-xs"
                    onClick={() => handleViewCourse(course)}
                  >
                    View Details
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-xs"
                    onClick={() => handleAddToCart(course)}
                    disabled={addToCart.isPending}
                  >
                    Add to Cart
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <i className="ri-bookmark-line text-4xl text-muted-foreground mb-2"></i>
            <p className="text-muted-foreground">No saved courses</p>
            <p className="text-xs text-muted-foreground mt-1">Save courses by clicking the bookmark icon</p>
          </div>
        )}
      </div>
    </div>
  );
}