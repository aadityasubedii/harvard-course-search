import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { chatService } from "./services/chatService";
import { courseService } from "./services/courseService";
import { z } from "zod";
import { insertChatMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // API routes
  
  // Chat routes
  app.post('/api/chat/message', async (req, res) => {
    try {
      const { content, filters } = req.body;
      
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ message: 'Content must be a non-empty string' });
      }
      
      // Save the user message
      await storage.createChatMessage({
        userId: 1, // Default user ID since we don't have auth
        role: 'user',
        content
      });
      
      // Process the message
      const response = await chatService.processMessage(content, filters);
      
      // Save the assistant message
      await storage.createChatMessage({
        userId: 1,
        role: 'assistant',
        content: response.content
      });
      
      res.json(response);
    } catch (error) {
      console.error('Error processing chat message:', error);
      res.status(500).json({ message: 'Failed to process message' });
    }
  });
  
  // Get chat suggestions
  app.get('/api/chat/suggestions', async (req, res) => {
    try {
      const suggestions = [
        "Show me GenEd courses",
        "Which CS courses have low workload?",
        "Compare CS50 and CS51",
        "Courses without Friday classes",
        "Show courses taught by David Malan"
      ];
      
      res.json(suggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      res.status(500).json({ message: 'Failed to fetch suggestions' });
    }
  });
  
  // Course routes
  
  // Get all courses
  app.get('/api/courses', async (req, res) => {
    try {
      const courses = await storage.getAllCourses();
      res.json(courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      res.status(500).json({ message: 'Failed to fetch courses' });
    }
  });
  
  // Get course by ID
  app.get('/api/courses/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid course ID' });
      }
      
      const course = await storage.getCourse(id);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      res.json(course);
    } catch (error) {
      console.error('Error fetching course:', error);
      res.status(500).json({ message: 'Failed to fetch course' });
    }
  });
  
  // Search courses with filters
  app.post('/api/courses/search', async (req, res) => {
    try {
      const filters = req.body.filters || {};
      const query = req.body.query || '';
      
      const courses = await courseService.searchCourses(query, filters);
      res.json(courses);
    } catch (error) {
      console.error('Error searching courses:', error);
      res.status(500).json({ message: 'Failed to search courses' });
    }
  });
  
  // Get all concentrations
  app.get('/api/courses/concentrations', async (req, res) => {
    try {
      const concentrations = await courseService.getConcentrations();
      res.json(concentrations);
    } catch (error) {
      console.error('Error fetching concentrations:', error);
      res.status(500).json({ message: 'Failed to fetch concentrations' });
    }
  });
  
  // Get all GenEd categories
  app.get('/api/courses/gened-categories', async (req, res) => {
    try {
      const categories = await courseService.getGenEdCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching GenEd categories:', error);
      res.status(500).json({ message: 'Failed to fetch GenEd categories' });
    }
  });
  
  // Save a course
  app.post('/api/courses/save', async (req, res) => {
    try {
      const { courseId } = req.body;
      
      if (!courseId || typeof courseId !== 'number') {
        return res.status(400).json({ message: 'Invalid course ID' });
      }
      
      // Check if course exists
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      // Save the course for the user
      await storage.saveCourse({
        userId: 1, // Default user ID
        courseId
      });
      
      res.json({ message: 'Course saved successfully' });
    } catch (error) {
      console.error('Error saving course:', error);
      res.status(500).json({ message: 'Failed to save course' });
    }
  });
  
  // Get saved courses
  app.get('/api/courses/saved', async (req, res) => {
    try {
      const userId = 1; // Default user ID
      const savedCourses = await storage.getSavedCourses(userId);
      res.json(savedCourses);
    } catch (error) {
      console.error('Error fetching saved courses:', error);
      res.status(500).json({ message: 'Failed to fetch saved courses' });
    }
  });
  
  // Add course to shopping cart
  app.post('/api/courses/add-to-cart', async (req, res) => {
    try {
      const { courseId } = req.body;
      
      if (!courseId || typeof courseId !== 'number') {
        return res.status(400).json({ message: 'Invalid course ID' });
      }
      
      // Here we would add to a shopping cart table, but for simplicity,
      // we'll just return success
      res.json({ message: 'Course added to cart successfully' });
    } catch (error) {
      console.error('Error adding course to cart:', error);
      res.status(500).json({ message: 'Failed to add course to cart' });
    }
  });

  return httpServer;
}
