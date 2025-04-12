import { useState, useEffect } from 'react';
import FiltersSidebar from '@/components/FiltersSidebar';
import ChatInterface from '@/components/ChatInterface';
import CourseDetailsSidebar from '@/components/CourseDetailsSidebar';
import CartSidebar from '@/components/CartSidebar';
import { useCourseStore } from '@/store/courseStore';
import { Course } from '@shared/schema';
import { useIsMobile } from '@/hooks/use-mobile';

export default function ChatBot() {
  const isMobile = useIsMobile();
  const [showFilterSidebar, setShowFilterSidebar] = useState(!isMobile);
  const [showDetailsSidebar, setShowDetailsSidebar] = useState(false);
  const [showCartSidebar, setShowCartSidebar] = useState(false);
  const selectedCourse = useCourseStore(state => state.selectedCourse);

  // Reset sidebars visibility based on screen size
  useEffect(() => {
    setShowFilterSidebar(!isMobile);
    if (isMobile) {
      setShowDetailsSidebar(false);
      setShowCartSidebar(false);
    }
  }, [isMobile]);

  // Show course details sidebar when a course is selected (on large screens)
  useEffect(() => {
    if (!isMobile && selectedCourse) {
      setShowDetailsSidebar(true);
    }
  }, [selectedCourse, isMobile]);

  const toggleFilterSidebar = () => {
    setShowFilterSidebar(!showFilterSidebar);
    if (isMobile && !showFilterSidebar) {
      setShowCartSidebar(false);
      setShowDetailsSidebar(false);
    }
  };

  const toggleCartSidebar = () => {
    setShowCartSidebar(!showCartSidebar);
    if (isMobile && !showCartSidebar) {
      setShowFilterSidebar(false);
      setShowDetailsSidebar(false);
    }
  };

  const handleSelectCourse = (course: Course) => {
    useCourseStore.getState().setSelectedCourse(course);
    
    if (!isMobile) {
      setShowDetailsSidebar(true);
    } else {
      // On mobile, we need to hide other sidebars
      setShowDetailsSidebar(true);
      setShowFilterSidebar(false);
      setShowCartSidebar(false);
    }
  };

  const closeDetailsSidebar = () => {
    setShowDetailsSidebar(false);
  };
  
  const closeCartSidebar = () => {
    setShowCartSidebar(false);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-dark text-foreground">
      {/* Filters Sidebar */}
      {showFilterSidebar && (
        <FiltersSidebar 
          className={isMobile ? "absolute z-10 top-16 h-[calc(100vh-4rem)]" : ""} 
          onClose={() => isMobile && setShowFilterSidebar(false)} 
        />
      )}
      
      {/* Main Chat Interface */}
      <ChatInterface 
        toggleFilterSidebar={toggleFilterSidebar}
        toggleCartSidebar={toggleCartSidebar}
        onSelectCourse={handleSelectCourse} 
      />
      
      {/* Course Details Sidebar */}
      {showDetailsSidebar && selectedCourse && (
        <CourseDetailsSidebar 
          course={selectedCourse} 
          onClose={closeDetailsSidebar}
          className={isMobile ? "absolute z-20 right-0 top-16 h-[calc(100vh-4rem)] w-full md:w-80" : ""}
        />
      )}
      
      {/* Shopping Cart Sidebar */}
      {showCartSidebar && (
        <CartSidebar 
          onClose={closeCartSidebar}
          onSelectCourse={handleSelectCourse}
          className={isMobile ? "absolute z-20 right-0 top-16 h-[calc(100vh-4rem)] w-full md:w-80" : ""}
        />
      )}
    </div>
  );
}
