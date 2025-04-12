import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { chatService } from "./services/chatService";
import { courseService } from "./services/courseService";
import { z } from "zod";
import { insertChatMessageSchema, Course } from "@shared/schema";

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
  
  // Delete saved course
  app.delete('/api/courses/saved', async (req, res) => {
    try {
      // Get courseId from query parameters
      const courseIdParam = req.query.courseId;
      const courseId = courseIdParam ? parseInt(courseIdParam as string) : null;
      
      if (!courseId || isNaN(courseId)) {
        return res.status(400).json({ message: 'Invalid course ID' });
      }
      
      const userId = 1; // Default user ID
      
      console.log(`Removing saved course ${courseId} for user ${userId}`);
      
      // Remove from saved courses
      await storage.removeSavedCourse(userId, courseId);
      
      return res.status(200).json({ message: 'Course removed from saved courses successfully' });
    } catch (error) {
      console.error('Error removing saved course:', error);
      return res.status(500).json({ message: 'Failed to remove course from saved courses' });
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

  // Remove course from shopping cart
  app.delete('/api/courses/cart', async (req, res) => {
    try {
      // Get courseId from query parameters instead of the body
      const courseIdParam = req.query.courseId;
      const courseId = courseIdParam ? parseInt(courseIdParam as string) : null;
      
      if (!courseId || isNaN(courseId)) {
        return res.status(400).json({ message: 'Invalid course ID' });
      }
      
      console.log(`Removing course ${courseId} from cart`);
      
      // Here we would remove from a shopping cart table, but for simplicity,
      // we'll just return success
      return res.status(200).json({ message: 'Course removed from cart successfully' });
    } catch (error) {
      console.error('Error removing course from cart:', error);
      return res.status(500).json({ message: 'Failed to remove course from cart' });
    }
  });

  // Helper function to parse course schedules and convert to iCal format
  // Defined outside the route handler to avoid strict mode issues
  function parseScheduleToIcalTimes(schedule: string): { 
    days: string[], 
    startTime: string, 
    endTime: string 
  } {
    // Default values if parsing fails
    const defaultResult = { 
      days: ['MO'], 
      startTime: '100000', 
      endTime: '113000' 
    };
    
    try {
      // Extract days and times
      // Expected format: "Mon/Wed 10-11:30am" or "Tue/Thu 1:30-3pm"
      const parts = schedule.split(' ');
      if (parts.length < 2) return defaultResult;
      
      // Parse days
      const daysPart = parts[0];
      const daysList: string[] = [];
      
      if (daysPart.includes('Mon')) daysList.push('MO');
      if (daysPart.includes('Tue')) daysList.push('TU');
      if (daysPart.includes('Wed')) daysList.push('WE');
      if (daysPart.includes('Thu')) daysList.push('TH');
      if (daysPart.includes('Fri')) daysList.push('FR');
      
      if (daysList.length === 0) daysList.push('MO'); // Default to Monday if no days found
      
      // Parse times
      const timePart = parts[1];
      const timeParts = timePart.split('-');
      if (timeParts.length < 2) return { days: daysList, startTime: defaultResult.startTime, endTime: defaultResult.endTime }; 
      
      // Process start time
      let startTime = timeParts[0].trim();
      let isPM = startTime.includes('pm');
      let hourMinStart = startTime.replace(/[ap]m/, '').split(':');
      let hourStart = parseInt(hourMinStart[0]);
      if (isPM && hourStart < 12) hourStart += 12;
      let minStart = hourMinStart.length > 1 ? parseInt(hourMinStart[1]) : 0;
      
      // Process end time
      let endTime = timeParts[1].trim();
      isPM = endTime.includes('pm');
      let hourMinEnd = endTime.replace(/[ap]m/, '').split(':');
      let hourEnd = parseInt(hourMinEnd[0]);
      if (isPM && hourEnd < 12) hourEnd += 12;
      let minEnd = hourMinEnd.length > 1 ? parseInt(hourMinEnd[1]) : 0;
      
      // Format to iCal time format HHMMSS
      const startTimeStr = String(hourStart).padStart(2, '0') + 
                          String(minStart).padStart(2, '0') + 
                          '00';
      const endTimeStr = String(hourEnd).padStart(2, '0') + 
                        String(minEnd).padStart(2, '0') + 
                        '00';
      
      return {
        days: daysList,
        startTime: startTimeStr,
        endTime: endTimeStr
      };
    } catch (error) {
      console.error('Error parsing schedule:', schedule, error);
      return defaultResult;
    }
  }

  // Dynamic calendar export
  app.get('/download-calendar.ics', async (req, res) => {
    try {
      console.log("Calendar export requested using dynamic course data");

      // Get cart courses to generate calendar
      const userId = 1; // Using default user for now
      const cartCourses = await storage.getSavedCourses(userId);
      console.log(`Found ${cartCourses.length} courses for calendar export`);
      
      // Start building the iCalendar file
      let icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//myharvard.ai//Harvard Course Schedule//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-TIMEZONE:America/New_York
`;

      // Add events for each course
      for (const course of cartCourses) {
        const { days, startTime, endTime } = parseScheduleToIcalTimes(course.schedule || 'Mon 10-11:30am');
        
        // For each day of the class, create an event in April 2025
        // (using a sample month for demonstration)
        const dates = {
          'MO': '20250414', // Monday, April 14, 2025
          'TU': '20250415', // Tuesday, April 15, 2025  
          'WE': '20250416', // Wednesday, April 16, 2025
          'TH': '20250417', // Thursday, April 17, 2025
          'FR': '20250418'  // Friday, April 18, 2025
        };
        
        for (const day of days) {
          const date = dates[day as keyof typeof dates] || dates.MO;
          
          icalContent += `
BEGIN:VEVENT
SUMMARY:${course.courseCode}: ${course.title}
UID:harvard-${course.courseCode.toLowerCase()}-${course.id}-${day}
SEQUENCE:0
STATUS:CONFIRMED
TRANSP:OPAQUE
DTSTART;TZID=America/New_York:${date}T${startTime}
DTEND;TZID=America/New_York:${date}T${endTime}
LOCATION:${course.location || 'TBD'}
DESCRIPTION:Professor: ${course.professor}\\nCredits: ${course.credits || 4}\\n${course.description.substring(0, 200)}
END:VEVENT
`;
        }
      }
      
      // Add timezone information
      icalContent += `
BEGIN:VTIMEZONE
TZID:America/New_York
TZURL:http://tzurl.org/zoneinfo/America/New_York
X-LIC-LOCATION:America/New_York
BEGIN:DAYLIGHT
TZOFFSETFROM:-0500
TZOFFSETTO:-0400
TZNAME:EDT
DTSTART:20250309T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:-0400
TZOFFSETTO:-0500
TZNAME:EST
DTSTART:20251102T020000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
END:STANDARD
END:VTIMEZONE

END:VCALENDAR`;
      
      // Set response headers and send
      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', 'attachment; filename=harvard_courses.ics');
      res.send(icalContent);
    } catch (error) {
      console.error('Error generating calendar:', error);
      res.status(500).send('Error generating calendar');
    }
  });

  return httpServer;
}
