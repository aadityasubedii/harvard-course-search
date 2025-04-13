import { storage } from "../storage";
import { Course } from "@shared/schema";
import { openai } from "./openai";
import { courseService } from "./courseService";

class ChatService {
  // Process a message and generate a response
  async processMessage(content: string, filters: Record<string, any> = {}): Promise<{
    content: string;
    courses?: Course[];
  }> {
    try {
      // Extract potential filters from the message using OpenAI
      const extractedFilters = await this.extractFiltersFromMessage(content, filters);
      
      // IMPORTANT: We've updated this logic to prioritize applied filters first
      // then apply the query to filter further
      
      // Log the combined filters
      console.log("Final filters:", extractedFilters);
      
      // Search for courses based on the filters and query
      // The updated searchCourses method now properly handles filtering
      const courses = await courseService.searchCourses(content, extractedFilters);
      
      console.log(`Found ${courses.length} courses matching filters:`, 
        courses.map(c => `${c.course_id}: ${c.title} (${c.concentration})`));
      
      // Generate a response based on the message and search results
      const response = await this.generateResponse(content, courses, extractedFilters);
      
      // Return all matching courses, our UI will handle the pagination/expansion
      return {
        content: response,
        courses: courses // Return all matches, UI will control display
      };
    } catch (error) {
      console.error('Error processing message:', error);
      return {
        content: "I'm sorry, I encountered an error while processing your request. Please try again."
      };
    }
  }
  
  // Extract filters from a message using OpenAI
  private async extractFiltersFromMessage(message: string, existingFilters: Record<string, any> = {}): Promise<Record<string, any>> {
    try {
      const prompt = `
        Extract course search filters from this message: "${message}"
        
        Current filters: ${JSON.stringify(existingFilters)}
        
        Valid filters:
        - semester (values: "fall", "spring", "all") - to filter by Fall 2024 or Spring 2025 courses
        - concentration (e.g., Computer Science, Economics, History)
        - genedCategory (e.g., Ethics & Civics, Science & Technology, or simply "true" to find all GenEd courses)
        - difficultyRating (1-5 scale, where 1 is easiest and 5 is hardest) - based on both student reviews and workload
        - workloadHours (use specific values: 2, 5, 10, 15, 20, 25 to indicate MAXIMUM hours per week - filter finds courses with LESS THAN this many hours)
        - qRating (1-5 scale, where 5 is best)
        - morning (boolean)
        - afternoon (boolean)
        - evening (boolean)
        - noFriday (boolean)
        - classSize (values: small, medium, large)
        - professor (string)
        
        IMPORTANT GUIDELINES:
        1. Return a JSON object with extracted filters, preserving existing filters and only adding/modifying ones explicitly mentioned.
        2. Only include filters that are CLEARLY and EXPLICITLY mentioned in the user's message.
        3. Be conservative with numeric ratings - DO NOT assign specific numeric values for subjective terms:
           - DO NOT convert terms like "easy", "good", or "difficult" into specific ratings
           - The search algorithm will handle these terms separately as text
        4. For GenEd courses:
           - If the user is searching for ALL GenEd courses (e.g., "show me GenEd courses"), set genedCategory: true
           - If a SPECIFIC category is mentioned (like "Aesthetics"), use that as the genedCategory value
        5. If you see "CS" or "cs" in the query, interpret this as "Computer Science" for the concentration filter
        6. IMPORTANT FOR SEMESTER DETECTION:
           - If words like "fall", "autumn", "fall semester", "fall 2024" appear in the message, set semester: "fall"
           - If words like "spring", "spring semester", "spring 2025" appear in the message, set semester: "spring"
           - Only set the semester if explicitly mentioned, otherwise don't include this filter
           - If both fall and spring are mentioned, don't set a semester filter (defaults to "all")
        
        Example response formats:
        
        For specific department search:
        {
          "concentration": "Computer Science",
          "noFriday": true,
          "qRating": 4,
          "workloadHours": 10,  // Finds courses with less than 10 hours of workload
          "semester": "fall"    // This would be included if "fall" is mentioned
        }
        
        For GenEd courses search:
        {
          "genedCategory": true,
          "semester": "spring"  // This would be included if "spring" is mentioned
        }
        
        For specific GenEd category with workload requirement:
        {
          "genedCategory": "Aesthetics",
          "workloadHours": 5,  // Finds courses with less than 5 hours of workload
          "semester": "fall"   // This would be included if "fall" is mentioned
        }
      `;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });
      
      const extractedContent = response.choices[0].message.content;
      
      console.log('OpenAI filter extraction response:', extractedContent);
      
      if (!extractedContent) {
        return existingFilters;
      }
      
      try {
        const extractedFilters = JSON.parse(extractedContent);
        console.log('Extracted filters:', extractedFilters);
        console.log('Final filters:', { ...existingFilters, ...extractedFilters });
        return { ...existingFilters, ...extractedFilters };
      } catch (parseError) {
        console.error('Error parsing JSON from OpenAI response:', parseError);
        return existingFilters;
      }
    } catch (error) {
      console.error('Error extracting filters with OpenAI:', error);
      return existingFilters;
    }
  }
  
  // Generate a response based on the message and search results
  private async generateResponse(message: string, courses: Course[], filters: Record<string, any>): Promise<string> {
    try {
      // Format applied filters for easier understanding in the output
      const formattedFilters = Object.keys(filters).length === 0 
        ? "None" 
        : Object.entries(filters)
            .map(([key, value]) => {
              if (value === true) return `• ${key}: Yes`;
              if (value === false) return `• ${key}: No`;
              return `• ${key}: ${value}`;
            })
            .join("\n");
            
      const courseInfo = courses.map(course => 
        `${course.course_id}: ${course.title} - Taught by ${course.professor} - Q Rating: ${course.qrating}`
      ).join("\n");
      
      // Create a welcome message with filtering instructions for first-time users
      const greetings = ['hi', 'hello', 'hey', 'greetings', 'howdy', 'hola', 'welcome'];
      const isFirstMessage = greetings.some(greeting => 
        message.toLowerCase().includes(greeting)) || message.trim().length < 10;
      
      const welcomeMessage = isFirstMessage ? `
        Welcome to myharvard.ai! Search tips:
        
        📋 SEARCH GUIDELINES:
        • Use specific search terms: course codes, professor names, or topics
        • Course IDs: CS50, MATH 21A, GENED 1093
        • Apply proper filters for your search intent
        
        ⚠️ IMPORTANT WARNINGS:
        • Be careful with filters you apply - make sure your filters match what you're looking for
        • For example, if looking for non-GenEd classes, don't apply a GenEd category filter. Similarly, if seeking Social Studies courses, don't apply "Computer Science" under the Concentration filter.
        
        Type your search query to find courses.
      ` : '';
      
      const prompt = `
        You are myharvard.ai, a course finder for Harvard students.
        
        ${isFirstMessage ? 'This is the user\'s first message. Respond with the welcome message below.' : ''}
        User message: "${message}"
        
        ${isFirstMessage ? welcomeMessage : ''}
        
        ${courses.length > 0 
          ? `Found ${courses.length} matching courses. Top results:\n${courseInfo}`
          : "No courses match the specified criteria."
        }
        
        IMPORTANT INSTRUCTIONS FOR GENERATING YOUR RESPONSE:
        1. For most searches, return an EMPTY STRING - let the course cards speak for themselves.
        2. NEVER include code blocks or markdown formatting in your response.
        3. DO NOT list course details or course cards in your response - the interface will already display them.
        4. DO NOT include any introductory or explanatory text.
        5. I found ${courses.length} courses matching this query.
        6. If I found 0 courses, ONLY then say "No courses match your criteria."
        7. Prefer returning an empty response whenever possible.
        8. DO NOT add any headers, conclusions, or explanations.
      `;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500
      });
      
      // Don't use the fallback message when we have courses
      const content = response.choices[0].message.content;
      
      if (content) {
        return content;
      } else if (courses.length > 0) {
        // If we have courses but no content from OpenAI, just show the applied filters
        const filterNames = Object.keys(filters);
        if (filterNames.length > 0) {
          return `Applied filters: ${filterNames.join(', ')}`;
        } else {
          return "";  // Empty response, let the course cards speak for themselves
        }
      } else {
        // Only use this message when we truly have no courses
        return "No courses match your criteria.";
      }
    } catch (error) {
      console.error('Error generating response with OpenAI:', error);
      
      // Even if there's an error, if we have courses, show something useful
      if (courses.length > 0) {
        const filterNames = Object.keys(filters);
        if (filterNames.length > 0) {
          return `Applied filters: ${filterNames.join(', ')}`;
        } else {
          return "";  // Empty response, let the course cards speak for themselves
        }
      } else {
        return "No courses match your criteria.";
      }
    }
  }
}

export const chatService = new ChatService();
