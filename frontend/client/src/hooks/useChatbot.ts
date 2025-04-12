import { useState, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChatMessage, ChatbotResponse, Course } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { v4 as uuidv4 } from "uuid";

export function useChatbot() {
  const [sessionId] = useState<string>(() => {
    return sessionStorage.getItem("chatSessionId") || (() => {
      const newId = uuidv4();
      sessionStorage.setItem("chatSessionId", newId);
      return newId;
    })();
  });
  
  const [suggestedCourses, setSuggestedCourses] = useState<Course[]>([]);
  const [filterSuggestions, setFilterSuggestions] = useState<Record<string, any>>({});

  // Get chat history
  const chatHistoryQuery = useQuery({
    queryKey: ["/api/chat", sessionId],
    enabled: !!sessionId,
  });

  // Send a message to the chatbot
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string): Promise<ChatbotResponse> => {
      const message: Partial<ChatMessage> = {
        role: "user",
        content,
        timestamp: new Date().toISOString(),
        sessionId,
      };

      const response = await apiRequest("POST", "/api/chat", message);
      return response.json();
    },
    onSuccess: (data) => {
      // Update suggested courses and filter suggestions
      setSuggestedCourses(data.suggestedCourses || []);
      setFilterSuggestions(data.filterSuggestions || {});
    },
  });

  const sendMessage = useCallback(
    async (content: string) => {
      return sendMessageMutation.mutateAsync(content);
    },
    [sendMessageMutation]
  );

  return {
    sessionId,
    messages: chatHistoryQuery.data as ChatMessage[] || [],
    isLoading: chatHistoryQuery.isLoading,
    isSending: sendMessageMutation.isPending,
    sendMessage,
    suggestedCourses,
    filterSuggestions,
  };
}
