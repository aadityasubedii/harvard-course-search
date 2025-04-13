import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage as ChatMessageType } from '@/lib/types';
import CourseCard from '@/components/CourseCard';
import { Course } from '@shared/schema';
import { useFilterStore } from '@/store/filterStore';
import { Button } from '@/components/ui/button';

type ChatMessagesProps = {
  messages: ChatMessageType[];
  isTyping: boolean;
  onSelectCourse: (course: Course) => void;
};

export default function ChatMessages({ messages, isTyping, onSelectCourse }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { filters } = useFilterStore();
  
  // Track expanded message indexes
  const [expandedMessages, setExpandedMessages] = useState<Record<number, boolean>>({});
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);
  
  // Toggle expanded state for a specific message
  const toggleExpanded = (messageIndex: number) => {
    setExpandedMessages(prev => ({
      ...prev,
      [messageIndex]: !prev[messageIndex]
    }));
    
    // Scroll to the bottom after expanding
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-6 scrollbar-thin bg-gray-50/50" id="chat-messages">
      <AnimatePresence>
        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="chat-message max-w-3xl mx-auto"
          >
            {message.role === 'assistant' ? (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-sm border border-primary/20">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 0L0 3v14l10 3 10-3V3L10 0zm.5 17.5L1 14.5v-9l9.5 3v9zM19 14.5l-7.5 3v-9l7.5-3v9z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="space-y-4 max-w-[90%]">
                  <div className="chat-bubble-assistant bg-white p-4 md:p-5 rounded-2xl rounded-tl-md border border-gray-200 shadow-sm">
                    <p className="whitespace-pre-wrap leading-relaxed text-gray-800 text-[15px]">{message.content}</p>
                    
                    {/* Render applied filters if any */}
                    {Object.keys(filters).length > 0 && index > 0 && messages[index-1].role === 'user' && (
                      <div className="mt-5 pt-4 border-t border-gray-100">
                        <p className="mb-2 text-sm font-medium text-gray-700">Applied filters:</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(filters).map(([key, value]) => 
                            value !== undefined && (
                              <div key={key} className="bg-gray-50 text-sm px-3 py-1 rounded-full flex items-center border border-gray-200">
                                {key === 'concentration' && <i className="ri-book-open-line mr-1.5 text-primary text-xs"></i>}
                                {key === 'genedCategory' && <i className="ri-medal-line mr-1.5 text-primary text-xs"></i>}
                                {key === 'difficultyRating' && <i className="ri-star-line mr-1.5 text-primary text-xs"></i>}
                                {key === 'noFriday' && <i className="ri-time-line mr-1.5 text-primary text-xs"></i>}
                                <span className="text-gray-700">{typeof value === 'boolean' ? key : `${key}: ${value}`}</span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Render course cards if any */}
                  {message.courses && message.courses.length > 0 && (
                    <div className="space-y-3 max-w-[95%]">
                      {/* Initially show only the first 3 courses or all if expanded */}
                      {message.courses
                        .slice(0, expandedMessages[index] ? message.courses.length : 3)
                        .map((course, courseIndex) => (
                          <CourseCard 
                            key={courseIndex} 
                            course={course} 
                            onClick={() => onSelectCourse(course)} 
                          />
                      ))}
                      
                      {/* Show "View More" button if there are more than 3 courses and not expanded */}
                      {message.courses.length > 3 && (
                        <Button
                          variant="outline"
                          className="w-full text-sm border-primary/30 hover:bg-primary/5 transition-colors font-medium shadow-sm flex items-center justify-center gap-2"
                          onClick={() => toggleExpanded(index)}
                        >
                          {expandedMessages[index] ? (
                            <>
                              <span>Show Less</span>
                              <i className="ri-arrow-up-s-line text-lg"></i>
                            </>
                          ) : (
                            <>
                              <span>View All {message.courses.length} Matching Courses</span>
                              <i className="ri-arrow-down-s-line text-lg"></i>
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-end gap-3">
                <div className="chat-bubble-user bg-primary/5 border border-primary/10 p-4 rounded-2xl rounded-tr-md max-w-[75%]">
                  <p className="text-[15px] text-gray-800 leading-relaxed">{message.content}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center text-primary shadow-sm border border-gray-200">
                  <span className="font-semibold text-sm">HS</span>
                </div>
              </div>
            )}
          </motion.div>
        ))}
        
        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="chat-message max-w-3xl mx-auto"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-sm border border-primary/20">
                <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 0L0 3v14l10 3 10-3V3L10 0zm.5 17.5L1 14.5v-9l9.5 3v9zM19 14.5l-7.5 3v-9l7.5-3v9z" fill="currentColor"/>
                </svg>
              </div>
              <div className="chat-bubble-assistant bg-white px-5 py-3 inline-flex items-center rounded-2xl rounded-tl-md border border-gray-200 shadow-sm">
                <div className="typing-indicator flex space-x-1.5">
                  <span className="bg-primary/40 w-2 h-2 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="bg-primary/40 w-2 h-2 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="bg-primary/40 w-2 h-2 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Invisible element to help with scrolling to the bottom */}
      <div ref={messagesEndRef} />
    </div>
  );
}
