import { users, type User, type InsertUser, Course, InsertCourse, ChatMessage, InsertChatMessage, SavedCourse, InsertSavedCourse, FilterPreference, InsertFilterPreference } from "@shared/schema";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Course methods
  getCourse(id: number): Promise<Course | undefined>;
  getCourseByCode(courseCode: string): Promise<Course | undefined>;
  getAllCourses(): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  searchCourses(filters: Record<string, any>): Promise<Course[]>;
  
  // Chat message methods
  getChatMessages(userId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Saved courses methods
  getSavedCourses(userId: number): Promise<Course[]>;
  saveCourse(savedCourse: InsertSavedCourse): Promise<SavedCourse>;
  removeSavedCourse(userId: number, courseId: number): Promise<void>;
  
  // Filter preferences methods
  getFilterPreference(userId: number): Promise<FilterPreference | undefined>;
  saveFilterPreference(filterPreference: InsertFilterPreference): Promise<FilterPreference>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private chatMessages: Map<number, ChatMessage>;
  private savedCourses: Map<number, SavedCourse>;
  private filterPreferences: Map<number, FilterPreference>;
  
  private currentUserId: number;
  private currentCourseId: number;
  private currentChatMessageId: number;
  private currentSavedCourseId: number;
  private currentFilterPreferenceId: number;

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.chatMessages = new Map();
    this.savedCourses = new Map();
    this.filterPreferences = new Map();
    
    this.currentUserId = 1;
    this.currentCourseId = 1;
    this.currentChatMessageId = 1;
    this.currentSavedCourseId = 1;
    this.currentFilterPreferenceId = 1;
    
    // Initialize with some sample data
    this.initSampleData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Course methods
  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }
  
  async getCourseByCode(courseCode: string): Promise<Course | undefined> {
    return Array.from(this.courses.values()).find(
      (course) => course.course_id === courseCode,
    );
  }
  
  async getAllCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }
  
  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = this.currentCourseId++;
    // Ensure all fields have appropriate values to satisfy type requirements
    const course: Course = { 
      id,
      course_id: insertCourse.course_id,
      title: insertCourse.title,
      professor: insertCourse.professor,
      qrating: insertCourse.qrating ?? null,
      course_description: insertCourse.course_description ?? null,
      average_workload: insertCourse.average_workload ?? null,
      class_size: insertCourse.class_size ?? null,
      gen_eds: Array.isArray(insertCourse.gen_eds) ? insertCourse.gen_eds : [],
      qguide_reviews: Array.isArray(insertCourse.qguide_reviews) ? insertCourse.qguide_reviews : [],
      concentration: insertCourse.concentration ?? null,
      schedule: insertCourse.schedule ?? null,
      term: insertCourse.term ?? null
    };
    this.courses.set(id, course);
    return course;
  }
  
  async searchCourses(filters: Record<string, any>): Promise<Course[]> {
    let courses = Array.from(this.courses.values());
    console.log(`Starting with ${courses.length} total courses from storage`);
    
    // Apply filters
    if (filters) {
      // Filter by semester/term first
      if (filters.semester) {
        console.log(`Filtering by semester: ${filters.semester}`);
        switch (filters.semester) {
          case 'fall':
            courses = courses.filter(course => course.term && course.term.toLowerCase().includes('fall'));
            break;
          case 'spring':
            courses = courses.filter(course => course.term && course.term.toLowerCase().includes('spring'));
            break;
          // If 'all' or invalid value, don't filter by semester
        }
        console.log(`After semester filter: ${courses.length} courses`);
      }
      // Search by query text (course title, description, professor, or course_id)
      if (filters.query) {
        const query = filters.query.toLowerCase();
        courses = courses.filter(course => 
          course.title.toLowerCase().includes(query) ||
          (course.course_description?.toLowerCase() || '').includes(query) ||
          course.professor.toLowerCase().includes(query) ||
          course.course_id.toLowerCase().includes(query) ||
          // Search in reviews too
          (course.qguide_reviews || []).some((review: string) => 
            review.toLowerCase().includes(query)
          )
        );
      }
      
      // Filter by concentration
      if (filters.concentration) {
        console.log('Filtering by concentration:', filters.concentration);
        // Handle special cases (anthro -> Anthropology)
        let normalizedConcentration = filters.concentration.toLowerCase();
        if (normalizedConcentration === 'anthro') {
          normalizedConcentration = 'anthropology';
        }
        
        courses = courses.filter(course => {
          if (!course.concentration) return false;
          // Perform case-insensitive comparison
          const courseConcentration = course.concentration.toLowerCase();
          return courseConcentration.includes(normalizedConcentration) || 
                 normalizedConcentration.includes(courseConcentration);
        });
        
        if (courses.length === 0 && normalizedConcentration === 'anthropology') {
          // Retry with prefix match if no results
          // Look for courses that have ANTHRO in their course_id
          courses = Array.from(this.courses.values()).filter(course => 
            course.course_id && course.course_id.includes('ANTHRO')
          );
        }
        
        console.log('Courses after concentration filter:', courses.length);
      }
      
      // Filter by GenEd category
      if (filters.genedCategory) {
        courses = courses.filter(course => {
          // First ensure the course is actually a GenEd course (has GENED in course_id)
          if (!course.course_id.includes('GENED')) return false;
          
          // If genedCategory is true or "GENED", return all GenEd courses
          if (filters.genedCategory === true || 
              filters.genedCategory === "true" || 
              filters.genedCategory.toString().toUpperCase() === "GENED") {
            return true;
          }
          
          // Otherwise check if it matches the specified GenEd category
          if (!course.gen_eds || !Array.isArray(course.gen_eds)) return false;
          
          try {
            const categoryLowerCase = filters.genedCategory.toString().toLowerCase();
            return course.gen_eds.some(category => 
              category && category.toLowerCase().includes(categoryLowerCase)
            );
          } catch (error) {
            console.error('Error comparing GenEd category:', error);
            return false;
          }
        });
      }
      
      // Filter by QGuide rating
      if (filters.qRating) {
        courses = courses.filter(course => (course.qrating || 0) >= filters.qRating);
      }
      
      // Filter by workload hours (LESS than: <2, <5, <10, <15, <20, <25)
      // Ignore filtering if the max value (25) is selected, which means "no limit"
      if (filters.workloadHours && parseInt(filters.workloadHours.toString(), 10) < 25) {
        const maxHours = parseInt(filters.workloadHours.toString(), 10);
        console.log(`Filtering by workload hours: <${maxHours}`);
        console.log(`Before workload filter: ${courses.length} courses`);
        
        // Extract numeric values from workload text like "12 hours per week"
        courses = courses.filter(course => {
          const workloadStr = course.average_workload || "";
          const workloadMatch = workloadStr.match(/(\d+(\.\d+)?)/);
          
          if (!workloadMatch) {
            // If no workload info, conservatively assume it's under the limit
            return true;
          }
          
          const workloadHours = parseFloat(workloadMatch[1]);
          const passed = workloadHours < maxHours;
          
          // Debug logs for workload filtering
          if (courses.length < 50) { // Only log details for smaller result sets
            console.log(`Course ${course.course_id}: workload ${workloadHours} hours, max allowed ${maxHours}, passed: ${passed}`);
          }
          
          return passed;
        });
        
        console.log(`After workload filter: ${courses.length} courses with <${maxHours} hours workload`);
      }
      
      // Legacy workload rating filter (for backward compatibility)
      if (filters.workloadRating) {
        const workloadMap: Record<number, number> = {
          1: 0,  // Very light: 0+ hours
          2: 2,  // Light: 2+ hours
          3: 5,  // Medium: 5+ hours
          4: 10, // Heavy: 10+ hours
          5: 15  // Very heavy: 15+ hours
        };
        
        const rating = Number(filters.workloadRating);
        const minHours = (rating >= 1 && rating <= 5) ? workloadMap[rating] : 0;
        
        // Extract numeric values from workload text like "12 hours per week"
        courses = courses.filter(course => {
          const workloadMatch = course.average_workload?.match(/(\d+)/);
          const workloadHours = workloadMatch ? parseInt(workloadMatch[1], 10) : 0;
          return workloadHours >= minHours;
        });
      }
      
      // Filter by difficulty rating
      if (filters.difficultyRating) {
        courses = courses.filter(course => {
          // Extract workload hours for difficulty calculation
          const workloadMatch = course.average_workload?.match(/(\d+)/);
          const workloadHours = workloadMatch ? parseInt(workloadMatch[1], 10) : 0;
          
          // Calculate difficulty based on both workload hours and QRating
          // Lower QRating + higher workload = higher difficulty
          
          // Get normalized QRating (1-5 scale, 5 is best)
          const qRating = course.qrating || 3.0; // Default to middle rating
          
          // Calculate difficulty score (1-5 scale, 5 is most difficult)
          let difficultyScore = 3; // Default to medium difficulty
          
          // Higher workload increases difficulty
          if (workloadHours >= 20) difficultyScore = 5;      // Very difficult: 20+ hours
          else if (workloadHours >= 15) difficultyScore = 4; // Difficult: 15-19 hours
          else if (workloadHours >= 10) difficultyScore = 3; // Moderate: 10-14 hours
          else if (workloadHours >= 5) difficultyScore = 2;  // Easy: 5-9 hours
          else difficultyScore = 1;                          // Very easy: 0-4 hours
          
          // Adjust difficulty based on QRating (lower ratings make courses more difficult)
          if (qRating < 3.0) difficultyScore = Math.min(5, difficultyScore + 1);
          else if (qRating > 4.5) difficultyScore = Math.max(1, difficultyScore - 1);
          
          // Ensure difficulty is at least at the minimum requested level
          return difficultyScore >= filters.difficultyRating;
        });
        
        console.log(`Filtered to ${courses.length} courses with difficulty rating ${filters.difficultyRating}+`);
      }
      
      // Filter by class schedule (no Friday classes)
      if (filters.noFriday === true) {
        courses = courses.filter(course => 
          course.schedule && !course.schedule.includes('Fri')
        );
      }
      
      // Filter by class size
      if (filters.classSize) {
        console.log(`Filtering by class size: ${filters.classSize}`);
        console.log(`Before class size filter: ${courses.length} courses`);
        
        switch (filters.classSize) {
          case 'small':
            courses = courses.filter(course => {
              const classSize = course.class_size || 0;
              return classSize > 0 && classSize < 30;
            });
            break;
          case 'medium':
            courses = courses.filter(course => 
              (course.class_size || 0) >= 30 && (course.class_size || 0) < 100
            );
            break;
          case 'large':
            courses = courses.filter(course => (course.class_size || 0) >= 100);
            break;
        }
        
        console.log(`After class size filter: ${courses.length} courses`);
      }
      
      // Filter by professor name
      if (filters.professor) {
        courses = courses.filter(course => 
          course.professor.toLowerCase().includes(filters.professor.toLowerCase())
        );
      }
      
      // Time of day filters - using OR logic between different time periods
      const hasTimeFilter = filters.morning === true || filters.afternoon === true || filters.evening === true;
      
      if (hasTimeFilter) {
        const timeFilteredCourses = courses.filter(course => {
          const isMorning = course.schedule?.toLowerCase().includes('am') || 
                           course.schedule?.match(/\b([7-9]|1[0-1])\b/); // 7am-11am
          
          const isAfternoon = (course.schedule?.toLowerCase().includes('pm') && 
                              course.schedule?.match(/\b([1-4])\b/)) || // 1pm-4pm
                              course.schedule?.match(/\b(1[2-9])\b/); // 12pm-1pm
          
          const isEvening = course.schedule?.toLowerCase().includes('pm') && 
                           course.schedule?.match(/\b([5-9]|1[0-1])\b/); // 5pm-11pm
          
          return (filters.morning === true && isMorning) || 
                 (filters.afternoon === true && isAfternoon) || 
                 (filters.evening === true && isEvening);
        });
        
        courses = timeFilteredCourses;
        console.log(`After time filter (OR logic), found ${courses.length} courses`);
      }
    }
    
    return courses;
  }
  
  // Chat message methods
  async getChatMessages(userId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.userId === userId)
      .sort((a, b) => {
        return new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime();
      });
  }
  
  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentChatMessageId++;
    const timestamp = new Date();
    const message: ChatMessage = { 
      id, 
      role: insertMessage.role,
      content: insertMessage.content,
      userId: insertMessage.userId || null,
      timestamp: timestamp
    };
    this.chatMessages.set(id, message);
    return message;
  }
  
  // Saved courses methods
  async getSavedCourses(userId: number): Promise<Course[]> {
    // Debug logs
    console.log(`Getting saved courses for user ${userId}`);
    console.log(`Total saved courses entries: ${this.savedCourses.size}`);
    
    const savedCourseEntries = Array.from(this.savedCourses.values())
      .filter(savedCourse => savedCourse.userId === userId);
    
    console.log(`Saved course entries for this user: ${savedCourseEntries.length}`);
    
    // If we don't have any saved courses yet, return empty array
    if (savedCourseEntries.length === 0) {
      return [];
    }
    
    const courseIds = savedCourseEntries.map(entry => entry.courseId);
    console.log(`Course IDs to find: ${JSON.stringify(courseIds)}`);
    
    return Array.from(this.courses.values())
      .filter(course => courseIds.includes(course.id));
  }
  
  async saveCourse(insertSavedCourse: InsertSavedCourse): Promise<SavedCourse> {
    const id = this.currentSavedCourseId++;
    const timestamp = new Date();
    const savedCourse: SavedCourse = { 
      id, 
      userId: insertSavedCourse.userId || null,
      courseId: insertSavedCourse.courseId || null,
      timestamp 
    };
    this.savedCourses.set(id, savedCourse);
    return savedCourse;
  }
  
  async removeSavedCourse(userId: number, courseId: number): Promise<void> {
    const savedCourseEntryToRemove = Array.from(this.savedCourses.entries())
      .find(([_, entry]) => entry.userId === userId && entry.courseId === courseId);
    
    if (savedCourseEntryToRemove) {
      this.savedCourses.delete(savedCourseEntryToRemove[0]);
    }
  }
  
  // Filter preferences methods
  async getFilterPreference(userId: number): Promise<FilterPreference | undefined> {
    return Array.from(this.filterPreferences.values())
      .find(preference => preference.userId === userId);
  }
  
  async saveFilterPreference(insertFilterPreference: InsertFilterPreference): Promise<FilterPreference> {
    // First, remove any existing preference for this user
    const existingEntry = Array.from(this.filterPreferences.entries())
      .find(([_, entry]) => entry.userId === insertFilterPreference.userId);
    
    if (existingEntry) {
      this.filterPreferences.delete(existingEntry[0]);
    }
    
    // Then add the new preference
    const id = this.currentFilterPreferenceId++;
    const timestamp = new Date();
    const filterPreference: FilterPreference = { 
      id, 
      userId: insertFilterPreference.userId || null,
      filters: insertFilterPreference.filters || null,
      timestamp
    };
    this.filterPreferences.set(id, filterPreference);
    return filterPreference;
  }
  
  // Initialize data from QGuide data JSON files for both semesters
  private initSampleData() {
    // Sample user
    const user = this.createUser({
      username: 'harvard_student',
      password: 'password123'
    });
    
    try {
      // Load Fall 2024 courses
      const fallDataPath = path.join(__dirname, 'data', 'qguide-data.json');
      const fallRawData = fs.readFileSync(fallDataPath, 'utf8');
      const fallQguideData = JSON.parse(fallRawData);
      
      console.log(`Loaded ${fallQguideData.length} courses from Fall 2024 QGuide data`);
      
      // Add each Fall course to our storage
      let courseId = 1; // Start with ID 1
      fallQguideData.forEach((course: any) => {
        // Convert from QGuide format to our storage format
        this.createCourse({
          course_id: course.course_id,
          title: course.title,
          professor: course.professor,
          qrating: course.qrating || null,
          course_description: course.course_description || null,
          average_workload: course.average_workload || null,
          class_size: course.class_size || null,
          gen_eds: Array.isArray(course.gen_eds) ? course.gen_eds : [],
          qguide_reviews: Array.isArray(course.qguide_reviews) ? course.qguide_reviews : [],
          // Additional fields for filtering
          concentration: this.extractConcentration(course.course_id),
          schedule: this.generateSchedule(course.course_id),
          term: 'Fall 2024'
        });
        courseId++;
      });
      
      // Try to load Spring 2025 courses if file exists
      try {
        // Try the new file name first (qguide_spring25.json)
        let springDataPath = path.join(__dirname, 'data', 'qguide_spring25.json');
        
        // If not found, try the original expected name as fallback
        if (!fs.existsSync(springDataPath)) {
          springDataPath = path.join(__dirname, 'data', 'qguide-data-spring.json');
        }
        
        if (fs.existsSync(springDataPath)) {
          const springRawData = fs.readFileSync(springDataPath, 'utf8');
          const springQguideData = JSON.parse(springRawData);
          
          console.log(`Loaded ${springQguideData.length} courses from Spring 2025 QGuide data`);
          
          // Add each Spring course to our storage (continuing the same ID sequence)
          springQguideData.forEach((course: any) => {
            // Convert from QGuide format to our storage format
            this.createCourse({
              course_id: course.course_id,
              title: course.title,
              professor: course.professor,
              qrating: course.qrating || null,
              course_description: course.course_description || null,
              average_workload: course.average_workload || null,
              class_size: course.class_size || null,
              gen_eds: Array.isArray(course.gen_eds) ? course.gen_eds : [],
              qguide_reviews: Array.isArray(course.qguide_reviews) ? course.qguide_reviews : [],
              // Additional fields for filtering
              concentration: this.extractConcentration(course.course_id),
              schedule: this.generateSchedule(course.course_id),
              term: 'Spring 2025'
            });
            courseId++;
          });
        } else {
          console.log('Spring 2025 data file not found. Only Fall 2024 courses loaded.');
        }
      } catch (springError) {
        console.error('Error loading Spring 2025 data:', springError);
        console.log('Continuing with only Fall 2024 courses.');
      }
      
      // Add some sample saved courses for the default user (after all courses are created)
      // Default user id is 1
      this.saveCourse({
        userId: 1,  // Use the known user ID instead of referencing the Promise
        courseId: 1  // First course
      });
      
      this.saveCourse({
        userId: 1,
        courseId: 3  // Third course
      });
      
    } catch (error) {
      console.error('Error loading QGuide data:', error);
      // Fallback to basic course if data can't be loaded
      this.createCourse({
        course_id: 'CS50',
        title: 'Introduction to Computer Science',
        professor: 'David Malan',
        qrating: 4.8,
        course_description: 'An introduction to computer science and programming.',
        average_workload: '12 hours per week',
        class_size: 500,
        gen_eds: ['QRD'] as string[],
        qguide_reviews: [
          'Malan is an incredible lecturer, but the workload is intense.',
          'Highly recommended, but not for the faint of heart.',
          'Amazing intro course, but a huge time commitment.'
        ] as string[],
        concentration: 'Computer Science',
        schedule: 'Mon/Wed 10-11:30am',
        term: 'Fall 2023'
      });
    }
  }
  
  // Helper methods for course data
  private extractConcentration(courseId: string): string | null {
    // Extract concentration from course ID (e.g., CS50 -> Computer Science)
    const prefixMap: Record<string, string> = {
      'CS': 'Computer Science',
      'COMPSCI': 'Computer Science',
      'ECON': 'Economics',
      'MATH': 'Mathematics',
      'HIST': 'History',
      'GENED': 'General Education',
      'ENG': 'Engineering',
      'ENGSCI': 'Engineering Sciences',
      'PSY': 'Psychology',
      'PSYCH': 'Psychology',
      'BIO': 'Biology',
      'CHEM': 'Chemistry',
      'PHYS': 'Physics',
      'GOV': 'Government',
      'STAT': 'Statistics',
      'AFRAMER': 'African and African American Studies',
      'AMST': 'American Studies',
      'ANTHRO': 'Anthropology',
      'ARTS': 'Visual and Environmental Studies',
      'SOCIOL': 'Sociology',
      'PHIL': 'Philosophy',
      'LING': 'Linguistics',
      'MCB': 'Molecular and Cellular Biology',
      'NEUROSCI': 'Neuroscience',
      'PHYSCI': 'Physical Sciences',
      'ENGLISH': 'English',
      'COMPLIT': 'Comparative Literature',
      'EALC': 'East Asian Languages and Civilizations',
      'FRENCH': 'French',
      'GERMAN': 'German',
      'SPANISH': 'Spanish',
      'ITALIAN': 'Italian',
      'CELTIC': 'Celtic Languages and Literatures',
      'SLAVIC': 'Slavic Languages and Literatures',
      'MUSIC': 'Music',
      'RELIGION': 'Religion',
      'WOMGEN': 'Women, Gender, and Sexuality'
    };
    
    // Extract prefix (letters before numbers)
    const prefix = courseId.match(/^[A-Za-z]+/)?.[0] || '';
    
    // For course IDs like "COMPSCI 50" we need to extract the department code more carefully
    let departmentCode = prefix;
    if (courseId.includes(' ')) {
      departmentCode = courseId.split(' ')[0];
    }
    
    return prefixMap[departmentCode] || null;
  }
  
  private generateSchedule(courseId: string): string | null {
    // Generate a plausible schedule based on course ID
    // This is more robust placeholder logic for the updated Fall 2024 data
    const dayOptions = [
      'Mon/Wed', 
      'Tue/Thu', 
      'Mon/Wed/Fri',
      'Tue/Thu/Fri',
      'Mon/Fri',
      'Wed only',
      'Thu only'
    ];
    
    const timeOptions = [
      '8:30-10:00am',
      '9:00-10:15am',
      '10:30-11:45am', 
      '12:00-1:15pm', 
      '1:30-2:45pm', 
      '3:00-4:15pm',
      '4:30-5:45pm',
      '6:00-7:15pm'
    ];
    
    // Use course ID to deterministically select days and times
    // Create a hash based on the course ID
    const courseIdStr = String(courseId);
    let hash = 0;
    for (let i = 0; i < courseIdStr.length; i++) {
      const char = courseIdStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Use absolute value and modulo to get positive indices
    const absHash = Math.abs(hash);
    const dayIndex = absHash % dayOptions.length;
    const timeIndex = (absHash >> 4) % timeOptions.length;
    
    return `${dayOptions[dayIndex]} ${timeOptions[timeIndex]}`;
  }
}

export const storage = new MemStorage();
