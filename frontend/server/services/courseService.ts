import { storage } from "../storage";
import { Course } from "@shared/schema";

class CourseService {
  // Search for courses based on filters and query
  async searchCourses(query: string, filters: Record<string, any>): Promise<Course[]> {
    try {
      // Get all courses from storage
      const allCourses = await storage.searchCourses(filters);
      
      // If there's a search query, filter further by matching text
      if (query && query.trim() !== '') {
        const searchTerms = query.toLowerCase().split(/\s+/);
        
        return allCourses.filter(course => {
          const searchableText = [
            course.courseCode,
            course.title,
            course.description,
            course.professor,
            course.concentration,
            course.genedCategory
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
            
          // Check if all search terms are found in the searchable text
          return searchTerms.every(term => searchableText.includes(term));
        });
      }
      
      return allCourses;
    } catch (error) {
      console.error('Error searching courses:', error);
      return [];
    }
  }
  
  // Get all available concentrations
  async getConcentrations(): Promise<string[]> {
    try {
      const courses = await storage.getAllCourses();
      
      // Extract unique concentrations
      const concentrations = new Set<string>();
      courses.forEach(course => {
        if (course.concentration) {
          concentrations.add(course.concentration);
        }
      });
      
      return Array.from(concentrations).sort();
    } catch (error) {
      console.error('Error getting concentrations:', error);
      return [];
    }
  }
  
  // Get all available GenEd categories
  async getGenEdCategories(): Promise<string[]> {
    try {
      const courses = await storage.getAllCourses();
      
      // Extract unique GenEd categories
      const categories = new Set<string>();
      courses.forEach(course => {
        if (course.genedCategory) {
          categories.add(course.genedCategory);
        }
      });
      
      return Array.from(categories).sort();
    } catch (error) {
      console.error('Error getting GenEd categories:', error);
      return [];
    }
  }
  
  // Get courses by professor
  async getCoursesByProfessor(professor: string): Promise<Course[]> {
    try {
      const courses = await storage.getAllCourses();
      
      return courses.filter(course => 
        course.professor.toLowerCase().includes(professor.toLowerCase())
      );
    } catch (error) {
      console.error('Error getting courses by professor:', error);
      return [];
    }
  }
  
  // Compare two courses
  async compareCourses(courseCode1: string, courseCode2: string): Promise<{
    course1: Course | null;
    course2: Course | null;
    comparison: Record<string, any>;
  }> {
    try {
      const course1 = await storage.getCourseByCode(courseCode1);
      const course2 = await storage.getCourseByCode(courseCode2);
      
      if (!course1 || !course2) {
        return {
          course1: course1 || null,
          course2: course2 || null,
          comparison: {}
        };
      }
      
      // Generate comparison data
      const comparison = {
        qRating: {
          better: course1.qRating > course2.qRating ? course1.courseCode : course2.courseCode,
          difference: Math.abs((course1.qRating || 0) - (course2.qRating || 0)).toFixed(1)
        },
        difficulty: {
          easier: course1.difficultyRating < course2.difficultyRating ? course1.courseCode : course2.courseCode,
          difference: Math.abs((course1.difficultyRating || 0) - (course2.difficultyRating || 0)).toFixed(1)
        },
        workload: {
          lighter: course1.workloadHours < course2.workloadHours ? course1.courseCode : course2.courseCode,
          difference: Math.abs((course1.workloadHours || 0) - (course2.workloadHours || 0))
        }
      };
      
      return {
        course1,
        course2,
        comparison
      };
    } catch (error) {
      console.error('Error comparing courses:', error);
      return {
        course1: null,
        course2: null,
        comparison: {}
      };
    }
  }
}

export const courseService = new CourseService();
