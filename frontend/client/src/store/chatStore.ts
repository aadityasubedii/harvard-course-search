import { create } from 'zustand';
import { ChatState, ChatMessage } from '@/lib/types';

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isTyping: false,
  
  addMessage: (message: ChatMessage) => set((state) => ({
    messages: [...state.messages, {
      ...message,
      timestamp: new Date()
    }]
  })),
  
  setIsTyping: (isTyping: boolean) => set({ isTyping }),
  
  clearMessages: () => set({ messages: [] })
}));
