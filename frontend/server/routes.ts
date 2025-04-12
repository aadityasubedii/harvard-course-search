import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getChatbotResponse } from "./openai";
import { z } from "zod";
import { insertChatMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all courses
  app.get("/api/courses", async (req: Request, res: Response) => {
    try {
      const courses = await storage.getAllCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  // Get filtered courses
  app.post("/api/courses/filter", async (req: Request, res: Response) => {
    try {
      const filters = req.body;
      const courses = await storage.getFilteredCourses(filters);
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Failed to filter courses" });
    }
  });

  // Get course by ID
  app.get("/api/courses/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid course ID" });
      }
      
      const course = await storage.getCourse(id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      res.json(course);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  // Get chat history
  app.get("/api/chat/:sessionId", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const messages = await storage.getChatMessages(sessionId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  // Send message to chatbot
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const messageSchema = insertChatMessageSchema.extend({
        content: z.string().min(1, "Message cannot be empty"),
        sessionId: z.string().min(1, "Session ID is required"),
      });
      
      const validatedMessage = messageSchema.parse(req.body);
      
      // Add user message to storage
      await storage.addChatMessage(validatedMessage);
      
      // Get session messages for context
      const sessionMessages = await storage.getChatMessages(validatedMessage.sessionId);
      
      // Format messages for OpenAI
      const formattedMessages = sessionMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Get courses for context
      const courses = await storage.getAllCourses();
      
      // Get chatbot response
      const chatbotResponse = await getChatbotResponse(formattedMessages, courses);
      
      // Save assistant response
      const assistantMessage = {
        role: "assistant",
        content: chatbotResponse.response,
        timestamp: new Date().toISOString(),
        sessionId: validatedMessage.sessionId,
        userId: validatedMessage.userId
      };
      
      const savedAssistantMessage = await storage.addChatMessage(assistantMessage);
      
      // If the chatbot suggested courses, get their details
      let suggestedCourses = [];
      if (chatbotResponse.courses.length > 0) {
        suggestedCourses = await Promise.all(
          chatbotResponse.courses.map(id => storage.getCourse(id))
        );
        suggestedCourses = suggestedCourses.filter(Boolean); // Remove undefined values
      }
      
      res.json({
        message: savedAssistantMessage,
        suggestedCourses,
        filterSuggestions: chatbotResponse.filter_suggestions
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // Get saved courses for a user
  app.get("/api/saved-courses/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const savedCourses = await storage.getSavedCourses(userId);
      
      // Get full course details for each saved course
      const coursesWithDetails = await Promise.all(
        savedCourses.map(async (sc) => {
          const course = await storage.getCourse(sc.courseId);
          return {
            ...sc,
            course
          };
        })
      );
      
      res.json(coursesWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch saved courses" });
    }
  });

  // Save a course for a user
  app.post("/api/saved-courses", async (req: Request, res: Response) => {
    try {
      const savedCourse = await storage.saveCourse(req.body);
      res.json(savedCourse);
    } catch (error) {
      res.status(500).json({ message: "Failed to save course" });
    }
  });

  // Remove a saved course
  app.delete("/api/saved-courses/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid saved course ID" });
      }
      
      const success = await storage.removeSavedCourse(id);
      if (!success) {
        return res.status(404).json({ message: "Saved course not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove saved course" });
    }
  });

  // Get filter settings for a user
  app.get("/api/filter-settings/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const settings = await storage.getFilterSettings(userId);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch filter settings" });
    }
  });

  // Save filter settings for a user
  app.post("/api/filter-settings", async (req: Request, res: Response) => {
    try {
      const settings = await storage.saveFilterSettings(req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to save filter settings" });
    }
  });

  // Delete filter settings
  app.delete("/api/filter-settings/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid settings ID" });
      }
      
      const success = await storage.deleteFilterSettings(id);
      if (!success) {
        return res.status(404).json({ message: "Filter settings not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete filter settings" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
