import { storage } from "../storage";
import { Course } from "@shared/schema";

class CourseService {
  // Search for courses based on filters and query
  async searchCourses(query: string, filters: Record<string, any>): Promise<Course[]> {
    try {
      console.log("Initial search query:", query);
      console.log("Applied filters:", filters);
      
      // Check for semester terms in the query (as a fallback to OpenAI detection)
      const updatedFilters = { ...filters };
      
      // Only check for semester if it's not already set in filters
      if (!updatedFilters.semester && query) {
        const queryLower = query.toLowerCase();
        
        // If the query contains "fall" or "autumn" without containing "spring", set semester to "fall"
        if ((queryLower.includes("fall") || queryLower.includes("autumn")) && 
            !queryLower.includes("spring")) {
          console.log("Detected 'fall' in the query, adding semester filter: fall");
          updatedFilters.semester = "fall";
        }
        // If the query contains "spring" without containing "fall" or "autumn", set semester to "spring"
        else if (queryLower.includes("spring") && 
                 !queryLower.includes("fall") && 
                 !queryLower.includes("autumn")) {
          console.log("Detected 'spring' in the query, adding semester filter: spring");
          updatedFilters.semester = "spring";
        }
      }
      
      // IMPORTANT: First get all courses that match the applied filters
      // This ensures we prioritize the filters the user has explicitly set
      const filteredCourses = await storage.searchCourses(updatedFilters);
      console.log(`Got ${filteredCourses.length} courses from storage after applying filters`);
      
      // If there's no query or it's empty, return the filtered courses as is
      if (!query || query.trim() === '') {
        return filteredCourses;
      }
      
      // Extract meaningful search terms from the query
      const searchTerms = query.toLowerCase().split(/\s+/);
      console.log("Search terms:", searchTerms);
      
      // Handle common synonyms and abbreviations
      const expandedTerms = searchTerms.map(term => {
        if (term === 'cs' || term === 'comp') return 'computer';
        if (term === 'classes' || term === 'class') return 'course';
        // Add more common abbreviations here as needed
        return term;
      });
      
      console.log("Expanded search terms:", expandedTerms);
      
      // Filter out conversational terms
      const conversationalTerms = ['give', 'me', 'show', 'find', 'get', 'class', 'classes', 'course', 'courses', 'with', 'in', 'a', 'the', 'that', 'has', 'have', 'are', 'is', 'would', 'like', 'want', 'please', 'looking', 'for', 'gened', 'geneds', 'gen-ed', 'gen-eds'];
      
      // Handle subjective quality terms (we keep these to search in text descriptions)
      const subjectiveTerms = {
        difficulty: ['easy', 'simple', 'doable', 'easier', 'hard', 'difficult', 'challenging', 'advanced', 'tough'],
        quality: ['good', 'great', 'best', 'excellent', 'top', 'popular', 'recommended', 'highly-rated', 'low', 'high'],
        workload: ['light', 'heavy', 'manageable', 'reasonable', 'intensive', 'demanding', 'time-consuming']
      };
      
      // Keep subjective quality terms for text search but mark as filtered to avoid double removal
      const markedSubjectiveTerms = new Set([
        ...subjectiveTerms.difficulty,
        ...subjectiveTerms.quality,
        ...subjectiveTerms.workload
      ]);
      
      const relevantTerms = expandedTerms.filter(term => 
        !conversationalTerms.includes(term) || markedSubjectiveTerms.has(term)
      );
      
      // If all search terms are just conversational ("show me classes"), 
      // we should return everything rather than filtering further
      if (relevantTerms.length === 0) {
        console.log("All search terms were conversational, returning filtered courses");
        return this.deduplicateCourses(filteredCourses);
      }
      
      // Handle special case for GenEd filter
      if (filters.genedCategory) {
        // If query is asking for GenEd courses and we have the GenEd filter
        if (query.toLowerCase().includes("gened") || 
            query.toLowerCase().includes("gen ed") || 
            query.toLowerCase().includes("gen-ed")) {
          console.log("GenEd already in filters and in query - no need to filter further");
          return this.deduplicateCourses(filteredCourses);
        }
      }

      // Handle special case for concentration already in filters
      if (filters.concentration) {
        // If query includes the concentration name or concentration abbreviation like "CS" for "Computer Science"
        if (query.toLowerCase().includes(filters.concentration.toLowerCase()) ||
            (filters.concentration === "Computer Science" && 
             query.toLowerCase().includes("cs"))) {
          console.log("Concentration already in filters and in query - no need to filter further");
          return this.deduplicateCourses(filteredCourses);
        }
      }
      
      // Further filter the already filtered courses based on the query
      const queryFilteredCourses = filteredCourses.filter(course => {
        const searchableText = [
          course.course_id,
          course.title,
          course.course_description,
          course.professor,
          course.concentration,
          // Handle gen_eds array by joining it
          course.gen_eds ? course.gen_eds.join(' ') : '',
          // Add common related terms
          course.concentration === "Computer Science" ? "cs comp" : ""
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
          
        // Look for any relevant term in the course data 
        return relevantTerms.some(term => searchableText.includes(term));
      });
      
      console.log(`After text search on filtered courses, found ${queryFilteredCourses.length} courses`);
      return this.deduplicateCourses(queryFilteredCourses);
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
      
      // Extract unique GenEd categories from gen_eds arrays
      const categories = new Set<string>();
      courses.forEach(course => {
        if (course.gen_eds && Array.isArray(course.gen_eds)) {
          course.gen_eds.forEach(category => {
            if (category) {
              categories.add(category);
            }
          });
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
  
  // Helper method to extract workload hours from a string
  private extractWorkloadHours(workloadString: string | null): number {
    if (!workloadString) return 0;
    
    // Try to extract a number from strings like "12 hours per week"
    const match = workloadString.match(/(\d+)/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    
    return 0;
  }
  
  // Helper method to deduplicate courses with the same course_id but different professors
  private deduplicateCourses(courses: Course[]): Course[] {
    const uniqueCourses = new Map<string, Course>();
    const professorsByCourse = new Map<string, Set<string>>();
    
    // First pass: collect all professors for each course
    courses.forEach(course => {
      const courseKey = course.course_id;
      if (!professorsByCourse.has(courseKey)) {
        professorsByCourse.set(courseKey, new Set<string>());
      }
      professorsByCourse.get(courseKey)?.add(course.professor);
      
      // Keep the course with the highest QRating as our base
      if (!uniqueCourses.has(courseKey) || 
          (course.qrating || 0) > (uniqueCourses.get(courseKey)?.qrating || 0)) {
        uniqueCourses.set(courseKey, { ...course });
      }
    });
    
    // Second pass: update the professor field to include all professors when there are multiple
    for (const [courseKey, professorsSet] of professorsByCourse.entries()) {
      if (professorsSet.size > 1) {
        const course = uniqueCourses.get(courseKey);
        if (course) {
          // Get the top 2 professors to avoid too much clutter
          const professors = Array.from(professorsSet).slice(0, 2);
          if (professors.length > 1) {
            course.professor = `${professors.join(', ')}${professors.length < professorsSet.size ? ' & others' : ''}`;
          }
        }
      }
    }
    
    console.log(`Deduplicated ${courses.length} courses to ${uniqueCourses.size} unique courses`);
    return Array.from(uniqueCourses.values());
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
      // Extract workload hours from text descriptions
      const workloadHours1 = this.extractWorkloadHours(course1.average_workload);
      const workloadHours2 = this.extractWorkloadHours(course2.average_workload);
      
      const comparison = {
        qRating: {
          better: (course1.qrating || 0) > (course2.qrating || 0) ? course1.course_id : course2.course_id,
          difference: Math.abs((course1.qrating || 0) - (course2.qrating || 0)).toFixed(1)
        },
        workload: {
          lighter: workloadHours1 < workloadHours2 ? course1.course_id : course2.course_id,
          difference: Math.abs(workloadHours1 - workloadHours2)
        },
        classSize: {
          smaller: (course1.class_size || 0) < (course2.class_size || 0) ? course1.course_id : course2.course_id,
          difference: Math.abs((course1.class_size || 0) - (course2.class_size || 0))
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
