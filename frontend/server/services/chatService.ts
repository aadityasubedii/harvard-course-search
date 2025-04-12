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
      
      // Search for courses based on the filters
      const courses = await courseService.searchCourses(content, extractedFilters);
      
      // Generate a response based on the message and search results
      const response = await this.generateResponse(content, courses, extractedFilters);
      
      return {
        content: response,
        courses: courses.slice(0, 3) // Limit to top 3 courses in the response
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
        - concentration (e.g., Computer Science, Economics, History)
        - genedCategory (e.g., Ethics & Civics, Science & Technology)
        - difficultyRating (1-5 scale, where 1 is easiest and 5 is hardest)
        - workloadRating (1-5 scale, where 1 is lightest and 5 is heaviest)
        - qRating (1-5 scale, where 5 is best)
        - morning (boolean)
        - afternoon (boolean)
        - evening (boolean)
        - noFriday (boolean)
        - classSize (values: small, medium, large)
        - professor (string)
        
        Return a JSON object with extracted filters, preserving existing filters and only adding/modifying ones explicitly mentioned.
        Only include filters that are clearly implied in the user's message.
        
        Example response format:
        {
          "concentration": "Computer Science",
          "noFriday": true,
          "qRating": 4
        }
      `;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });
      
      const extractedContent = response.choices[0].message.content;
      
      if (!extractedContent) {
        return existingFilters;
      }
      
      try {
        const extractedFilters = JSON.parse(extractedContent);
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
      const courseInfo = courses.map(course => 
        `${course.courseCode}: ${course.title} - Taught by ${course.professor} - Q Rating: ${course.qRating}`
      ).join("\n");
      
      const prompt = `
        You are Harvard CourseBot, an assistant that helps Harvard students find and select courses.
        
        User message: "${message}"
        
        Applied filters: ${JSON.stringify(filters)}
        
        ${courses.length > 0 
          ? `Found ${courses.length} matching courses. Top results:\n${courseInfo}`
          : "No courses match the specified criteria."
        }
        
        Generate a helpful, conversational response that addresses the user's query.
        
        If courses were found:
        1. Acknowledge the search criteria
        2. Briefly mention the top matches
        3. Suggest ways to refine the search if there are many results
        
        If no courses were found:
        1. Acknowledge the search criteria
        2. Suggest broader search terms or alternative filters
        
        Keep your response concise and friendly. Don't list all courses in your response, as they will be displayed separately.
      `;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500
      });
      
      return response.choices[0].message.content || "I'm sorry, I couldn't find any relevant information.";
    } catch (error) {
      console.error('Error generating response with OpenAI:', error);
      return "I've found some courses that might interest you, but I'm having trouble generating a detailed response. Please take a look at the results below.";
    }
  }
}

export const chatService = new ChatService();
