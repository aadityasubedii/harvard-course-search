import { useEffect, useState } from 'react';
import ChatMessages from '@/components/ChatMessages';
import ChatInput from '@/components/ChatInput';
import { Course } from '@shared/schema';
import { useChatStore } from '@/store/chatStore';
import { useFilterStore } from '@/store/filterStore';
import { useCourseStore } from '@/store/courseStore';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import SavedCoursesSidebar from '@/components/SavedCoursesSidebar';

type ChatInterfaceProps = {
  toggleFilterSidebar: () => void;
  toggleCartSidebar: () => void;
  onSelectCourse: (course: Course) => void;
};

export default function ChatInterface({ toggleFilterSidebar, toggleCartSidebar, onSelectCourse }: ChatInterfaceProps) {
  const { messages, addMessage, isTyping, setIsTyping } = useChatStore();
  const { filters } = useFilterStore();
  const { cartCourses, savedCourses } = useCourseStore();
  const { toast } = useToast();
  const [savedCoursesOpen, setSavedCoursesOpen] = useState(false);
  
  const toggleSavedCoursesSidebar = () => {
    setSavedCoursesOpen(!savedCoursesOpen);
  };

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest('POST', '/api/chat/message', { 
        content, 
        filters 
      });
      return res.json();
    },
    onSuccess: (data) => {
      addMessage({
        role: 'assistant',
        content: data.content,
        courses: data.courses || []
      });
      setIsTyping(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to send message: ${error.message}`,
        variant: 'destructive'
      });
      setIsTyping(false);
    }
  });

  const handleSendMessage = (content: string) => {
    // Add the user message to the chat
    addMessage({
      role: 'user',
      content
    });
    
    // Set the bot to typing state
    setIsTyping(true);
    
    // Send the message to the API
    sendMessage.mutate(content);
  };

  // Show welcome message on first load
  useEffect(() => {
    if (messages.length === 0) {
      // Initial welcome message with the improved filtering instructions
      addMessage({
        role: 'assistant',
        content: `Welcome to myharvard.ai! Search tips:

📋 SEARCH GUIDELINES:
• Use specific search terms: course codes, professor names, or topics
• Course IDs: CS50, MATH 21A, GENED 1093
• Apply proper filters for your search intent

⚠️ IMPORTANT WARNINGS:
• Be careful with filters you apply - make sure your filters match what you're looking for
• For example, if looking for non-GenEd classes, don't apply a GenEd category filter. Similarly, if seeking Social Studies courses, don't apply "Computer Science" under the Concentration filter.

Type your search query to find courses.`
      });
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-background relative">
      {/* Saved Courses Sidebar */}
      {savedCoursesOpen && (
        <div className="absolute top-0 right-0 bottom-0 z-50">
          <SavedCoursesSidebar 
            onClose={toggleSavedCoursesSidebar}
            onSelectCourse={onSelectCourse}
          />
        </div>
      )}
      
      {/* Header */}
      <header className="harvard-header py-4">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center">
            {/* Mobile menu button on left, visible only on mobile */}
            <button 
              onClick={toggleFilterSidebar} 
              className="md:hidden absolute left-4 text-gray-600 hover:text-primary p-1.5 rounded-md border border-gray-200 hover:border-primary/40 bg-gray-50"
            >
              <i className="ri-menu-line text-lg"></i>
            </button>
            
            {/* Centered myharvard.ai - using single span for perfect alignment */}
            <div>
              <span className="text-3xl font-bold text-primary">myharvard.ai</span>
            </div>
          </div>
          
          {/* Action buttons positioned absolutely on the right */}
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <button 
              className="p-1.5 text-gray-600 hover:text-primary rounded-md hover:bg-gray-100 transition-colors border border-gray-200 hover:border-primary/40 relative"
              onClick={toggleSavedCoursesSidebar}
              aria-label="Saved courses"
            >
              <i className="ri-bookmark-line text-lg"></i>
              {savedCourses.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {savedCourses.length}
                </span>
              )}
            </button>
            <button 
              className="p-1.5 text-gray-600 hover:text-primary rounded-md hover:bg-gray-100 transition-colors border border-gray-200 hover:border-primary/40 relative"
              onClick={toggleCartSidebar}
              aria-label="Shopping cart"
            >
              <i className="ri-shopping-cart-line text-lg"></i>
              {cartCourses.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCourses.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
      
      {/* Chat Messages Container */}
      <ChatMessages 
        messages={messages} 
        isTyping={isTyping} 
        onSelectCourse={onSelectCourse} 
      />
      
      {/* Chat Input */}
      <ChatInput onSendMessage={handleSendMessage} isPending={isTyping} />
    </div>
  );
}
