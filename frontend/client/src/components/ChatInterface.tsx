import { useState, useRef, useEffect } from "react";
import { useChatbot } from "@/hooks/useChatbot";
import CourseCard from "./CourseCard";
import { Course } from "@/types";

interface ChatInterfaceProps {
  onFilterSuggestions: (suggestions: Record<string, any>) => void;
  openMobileFilters: () => void;
}

export default function ChatInterface({ onFilterSuggestions, openMobileFilters }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { 
    messages, 
    sendMessage, 
    isSending,
    suggestedCourses,
    filterSuggestions
  } = useChatbot();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  // Handle filter suggestions
  useEffect(() => {
    if (Object.keys(filterSuggestions).length > 0) {
      onFilterSuggestions(filterSuggestions);
    }
  }, [filterSuggestions, onFilterSuggestions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isSending) return;
    
    try {
      setInputValue("");
      await sendMessage(inputValue.trim());
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  return (
    <div className="lg:col-span-3 flex flex-col h-[calc(100vh-7rem)]">
      <div className="glass-panel rounded-lg p-4 mb-4 shadow-sm">
        <h2 className="font-display text-md font-medium text-neutral-800">Harvard Course Assistant</h2>
        <p className="text-sm text-neutral-500 mt-1">Ask me about Harvard courses, and I'll help you find the perfect fit.</p>
      </div>
      
      {/* Chat Messages Container */}
      <div className="flex-1 glass-panel rounded-lg overflow-hidden flex flex-col shadow-sm">
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Welcome Message (shown if no messages yet) */}
          {messages.length === 0 && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </div>
              <div className="flex-1">
                <div className="bg-white rounded-xl rounded-tl-none py-3 px-4 shadow-sm border border-neutral-100">
                  <p className="text-neutral-800">👋 Hello! I'm your Harvard Course Assistant. I can help you find courses based on:</p>
                  <ul className="text-neutral-700 list-disc list-inside mt-2 space-y-1">
                    <li>Concentration or subject area</li>
                    <li>GenEd requirements</li>
                    <li>Q Guide ratings and workload</li>
                    <li>Class size and schedule preferences</li>
                  </ul>
                  <p className="text-neutral-800 mt-2">What are you looking for today?</p>
                </div>
                <div className="text-xs text-neutral-500 mt-1 ml-1">{formatTime(new Date().toISOString())}</div>
              </div>
            </div>
          )}
          
          {/* Chat Messages */}
          {messages.map((message, index) => (
            <div 
              key={message.id || index} 
              className={`flex items-start ${
                message.role === 'user' ? 'justify-end space-x-3' : 'space-x-3'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                </div>
              )}
              
              <div className={`flex-1 ${message.role === 'user' ? 'max-w-[80%]' : ''}`}>
                <div className={`${
                  message.role === 'user' 
                    ? 'bg-primary/10 border border-primary/20 text-neutral-800 rounded-xl rounded-tr-none' 
                    : 'bg-white border border-neutral-100 text-neutral-800 rounded-xl rounded-tl-none shadow-sm'
                } py-3 px-4`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                <div className={`text-xs text-neutral-500 mt-1 ${
                  message.role === 'user' ? 'mr-1 text-right' : 'ml-1'
                }`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
              
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
              )}
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isSending && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </div>
              <div className="flex-1">
                <div className="frosted-glass rounded-2xl rounded-tl-none py-3 px-4 inline-block">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                    <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Show suggested courses after assistant message */}
          {suggestedCourses.length > 0 && !isSending && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </div>
              <div className="flex-1">
                <div className="frosted-glass rounded-2xl rounded-tl-none py-3 px-4">
                  <p className="text-white mb-3">Here are some courses that match your criteria:</p>
                  
                  <div className="space-y-3">
                    {suggestedCourses.map((course: Course) => (
                      <CourseCard key={course.id} course={course} />
                    ))}
                  </div>
                </div>
                <div className="text-xs text-neutral-500 mt-1 ml-1">{formatTime(new Date().toISOString())}</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Chat Input */}
        <div className="border-t border-neutral-200 p-3 bg-white shadow-sm">
          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <button 
              type="button" 
              className="p-2 text-neutral-500 hover:text-primary transition-colors"
              onClick={openMobileFilters}
              aria-label="Filters"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="21" x2="4" y2="14"></line>
                <line x1="4" y1="10" x2="4" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12" y2="3"></line>
                <line x1="20" y1="21" x2="20" y2="16"></line>
                <line x1="20" y1="12" x2="20" y2="3"></line>
                <line x1="1" y1="14" x2="7" y2="14"></line>
                <line x1="9" y1="8" x2="15" y2="8"></line>
                <line x1="17" y1="16" x2="23" y2="16"></line>
              </svg>
            </button>
            
            <div className="relative flex-1">
              <input 
                ref={inputRef}
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about courses or requirements..." 
                className="w-full py-2.5 pl-4 pr-10 rounded-full glass-input focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 text-neutral-800"
                disabled={isSending}
              />
              <button 
                type="button" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-neutral-400 hover:text-primary transition-colors"
                aria-label="Voice input"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              </button>
            </div>
            
            <button 
              type="submit" 
              className={`p-2.5 rounded-full transition-all ${
                isSending || !inputValue.trim() 
                  ? 'bg-neutral-100 border border-neutral-200 text-neutral-400 cursor-not-allowed' 
                  : 'bg-primary text-white hover:bg-primary/90 harvard-shadow'
              }`}
              disabled={isSending || !inputValue.trim()}
              aria-label="Send"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
          
          <div className="flex justify-center mt-2">
            <div className="flex space-x-3 text-xs text-neutral-500">
              <button className="hover:text-primary transition-colors">Compare Courses</button>
              <span>•</span>
              <button 
                className="hover:text-primary transition-colors font-medium"
                onClick={openMobileFilters}
              >
                Advanced Filters
              </button>
              <span>•</span>
              <button className="hover:text-primary transition-colors">Save Results</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
