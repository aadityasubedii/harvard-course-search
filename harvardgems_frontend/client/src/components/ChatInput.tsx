import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';

type ChatInputProps = {
  onSendMessage: (message: string) => void;
  isPending: boolean;
};

export default function ChatInput({ onSendMessage, isPending }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Fetch suggestion messages
  const { data: suggestions } = useQuery<string[]>({
    queryKey: ['/api/chat/suggestions'],
    initialData: [],
  });

  const handleSendMessage = () => {
    if (message.trim() && !isPending) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    // Focus the input after selecting a suggestion
    inputRef.current?.focus();
  };

  return (
    <div className="px-4 py-5 md:py-6 border-t border-gray-200 bg-white">
      <div className="relative flex items-center max-w-3xl mx-auto">
        <div className="absolute left-4 text-primary/60 hover:text-primary">
          <i className="ri-mic-line text-lg"></i>
        </div>
        <Input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about courses, requirements, or recommendations..."
          className="w-full bg-gray-50 border border-gray-200 shadow-sm rounded-full py-3.5 px-12 focus-visible:ring-primary/50 focus-visible:border-primary/70 text-gray-800"
          disabled={isPending}
        />
        <div className="absolute right-3">
          <Button
            type="button"
            onClick={handleSendMessage}
            disabled={isPending || message.trim() === ''}
            variant="ghost"
            size="icon"
            className="text-primary hover:text-primary/90 disabled:opacity-50 hover:bg-primary/5 h-9 w-9 rounded-full"
          >
            {isPending ? 
              <i className="ri-loader-4-line animate-spin text-lg"></i> : 
              <i className="ri-send-plane-fill text-lg"></i>
            }
          </Button>
        </div>
      </div>
      
      {/* Quick Suggestion Pills */}
      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-3xl mx-auto">
          {suggestions.map((suggestion: string, index: number) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="bg-gray-50 text-gray-700 text-xs py-2 px-4 rounded-full border border-gray-200 hover:border-primary/40 hover:bg-primary/5 transition-colors shadow-sm font-medium"
            >
              "{suggestion}"
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
