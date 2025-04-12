import { 
  users, type User, type InsertUser,
  courses, type Course, type InsertCourse,
  chatMessages, type ChatMessage, type InsertChatMessage,
  savedCourses, type SavedCourse, type InsertSavedCourse,
  filterSettings, type FilterSetting, type InsertFilterSetting
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Course methods
  getCourse(id: number): Promise<Course | undefined>;
  getCourseByCode(courseCode: string): Promise<Course | undefined>;
  getAllCourses(): Promise<Course[]>;
  getFilteredCourses(filters: CourseFilters): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  
  // Chat message methods
  getChatMessages(sessionId: string): Promise<ChatMessage[]>;
  addChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Saved course methods
  getSavedCourses(userId: number): Promise<SavedCourse[]>;
  saveCourse(savedCourse: InsertSavedCourse): Promise<SavedCourse>;
  removeSavedCourse(id: number): Promise<boolean>;
  
  // Filter settings methods
  getFilterSettings(userId: number): Promise<FilterSetting[]>;
  saveFilterSettings(settings: InsertFilterSetting): Promise<FilterSetting>;
  deleteFilterSettings(id: number): Promise<boolean>;
}

export interface CourseFilters {
  concentration?: string;
  genedCategory?: string[];
  difficulty?: { min?: number; max?: number };
  workload?: { min?: number; max?: number };
  classSize?: string[];
  timeSlot?: string[];
  instructor?: string;
  searchTerm?: string;
  semester?: string;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private coursesByCode: Map<string, Course>;
  private chatMessages: Map<number, ChatMessage>;
  private savedCourses: Map<number, SavedCourse>;
  private filterSettings: Map<number, FilterSetting>;
  
  private userId: number;
  private courseId: number;
  private chatMessageId: number;
  private savedCourseId: number;
  private filterSettingsId: number;
  
  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.coursesByCode = new Map();
    this.chatMessages = new Map();
    this.savedCourses = new Map();
    this.filterSettings = new Map();
    
    this.userId = 1;
    this.courseId = 1;
    this.chatMessageId = 1;
    this.savedCourseId = 1;
    this.filterSettingsId = 1;
    
    // Add some example courses
    this.seedCourses();
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
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Course methods
  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }
  
  async getCourseByCode(courseCode: string): Promise<Course | undefined> {
    return this.coursesByCode.get(courseCode);
  }
  
  async getAllCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }
  
  async getFilteredCourses(filters: CourseFilters): Promise<Course[]> {
    let filteredCourses = Array.from(this.courses.values());
    
    // Apply concentration filter
    if (filters.concentration) {
      filteredCourses = filteredCourses.filter(
        course => course.concentration === filters.concentration
      );
    }
    
    // Apply genedCategory filter
    if (filters.genedCategory && filters.genedCategory.length > 0) {
      filteredCourses = filteredCourses.filter(
        course => course.genedCategory && filters.genedCategory?.includes(course.genedCategory)
      );
    }
    
    // Apply difficulty filter
    if (filters.difficulty) {
      if (filters.difficulty.min !== undefined) {
        filteredCourses = filteredCourses.filter(
          course => course.difficulty !== null && course.difficulty >= (filters.difficulty.min || 0)
        );
      }
      if (filters.difficulty.max !== undefined) {
        filteredCourses = filteredCourses.filter(
          course => course.difficulty !== null && course.difficulty <= (filters.difficulty.max || 5)
        );
      }
    }
    
    // Apply workload filter
    if (filters.workload) {
      if (filters.workload.min !== undefined) {
        filteredCourses = filteredCourses.filter(
          course => course.workload !== null && course.workload >= (filters.workload.min || 0)
        );
      }
      if (filters.workload.max !== undefined) {
        filteredCourses = filteredCourses.filter(
          course => course.workload !== null && course.workload <= (filters.workload.max || 20)
        );
      }
    }
    
    // Apply class size filter
    if (filters.classSize && filters.classSize.length > 0) {
      filteredCourses = filteredCourses.filter(
        course => filters.classSize?.includes(course.classSize)
      );
    }
    
    // Apply time slot filter
    if (filters.timeSlot && filters.timeSlot.length > 0) {
      filteredCourses = filteredCourses.filter(course => {
        const timeSlot = course.timeSlot.toLowerCase();
        return filters.timeSlot?.some(slot => {
          switch (slot.toLowerCase()) {
            case 'morning':
              return timeSlot.includes('am');
            case 'afternoon':
              return timeSlot.includes('pm') && 
                (timeSlot.includes('12') || 
                timeSlot.includes('1') || 
                timeSlot.includes('2') || 
                timeSlot.includes('3') || 
                timeSlot.includes('4'));
            case 'evening':
              return timeSlot.includes('pm') && 
                (timeSlot.includes('5') || 
                timeSlot.includes('6') || 
                timeSlot.includes('7') || 
                timeSlot.includes('8') || 
                timeSlot.includes('9'));
            default:
              return timeSlot.includes(slot.toLowerCase());
          }
        });
      });
    }
    
    // Apply instructor filter
    if (filters.instructor) {
      filteredCourses = filteredCourses.filter(
        course => course.instructor.toLowerCase().includes(filters.instructor?.toLowerCase() || '')
      );
    }
    
    // Apply search term filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filteredCourses = filteredCourses.filter(
        course => 
          course.title.toLowerCase().includes(searchTerm) ||
          course.courseCode.toLowerCase().includes(searchTerm) ||
          course.description.toLowerCase().includes(searchTerm) ||
          course.instructor.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply semester filter
    if (filters.semester) {
      filteredCourses = filteredCourses.filter(
        course => course.semester === filters.semester
      );
    }
    
    return filteredCourses;
  }
  
  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = this.courseId++;
    const course: Course = { ...insertCourse, id };
    this.courses.set(id, course);
    this.coursesByCode.set(course.courseCode, course);
    return course;
  }
  
  // Chat message methods
  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values()).filter(
      message => message.sessionId === sessionId
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
  
  async addChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.chatMessageId++;
    const message: ChatMessage = { ...insertMessage, id };
    this.chatMessages.set(id, message);
    return message;
  }
  
  // Saved course methods
  async getSavedCourses(userId: number): Promise<SavedCourse[]> {
    return Array.from(this.savedCourses.values()).filter(
      savedCourse => savedCourse.userId === userId
    );
  }
  
  async saveCourse(insertSavedCourse: InsertSavedCourse): Promise<SavedCourse> {
    const id = this.savedCourseId++;
    const savedCourse: SavedCourse = { ...insertSavedCourse, id };
    this.savedCourses.set(id, savedCourse);
    return savedCourse;
  }
  
  async removeSavedCourse(id: number): Promise<boolean> {
    return this.savedCourses.delete(id);
  }
  
  // Filter settings methods
  async getFilterSettings(userId: number): Promise<FilterSetting[]> {
    return Array.from(this.filterSettings.values()).filter(
      setting => setting.userId === userId
    );
  }
  
  async saveFilterSettings(insertSettings: InsertFilterSetting): Promise<FilterSetting> {
    const id = this.filterSettingsId++;
    const settings: FilterSetting = { ...insertSettings, id };
    this.filterSettings.set(id, settings);
    return settings;
  }
  
  async deleteFilterSettings(id: number): Promise<boolean> {
    return this.filterSettings.delete(id);
  }

  // Seed sample courses for development
  private seedCourses() {
    const sampleCourses: InsertCourse[] = [
      {
        courseCode: "CS50",
        title: "Introduction to Computer Science",
        description: "Introduction to the intellectual enterprises of computer science and the art of programming.",
        instructor: "David Malan",
        concentration: "Computer Science",
        genedCategory: "Science & Technology",
        difficulty: 3.5,
        workload: 9,
        classSize: "Large",
        classSizeNumber: 800,
        timeSlot: "Mon/Wed 3-4:30pm",
        location: "Sanders Theatre",
        qGuideRating: 4.8,
        prerequisites: null,
        tags: ["GenEd Eligible", "No Prerequisites"],
        semester: "Fall 2023",
        syllabus: "https://cs50.harvard.edu/college/2023/fall/syllabus/",
      },
      {
        courseCode: "CS51",
        title: "Abstraction and Design in Computation",
        description: "Explores the roles of abstraction and design in computation.",
        instructor: "Stuart Shieber",
        concentration: "Computer Science",
        genedCategory: null,
        difficulty: 4.0,
        workload: 11,
        classSize: "Medium",
        classSizeNumber: 150,
        timeSlot: "Tue/Thu 2-3:30pm",
        location: "Maxwell Dworkin G115",
        qGuideRating: 4.2,
        prerequisites: "CS50 or equivalent programming experience",
        tags: ["CS Concentration"],
        semester: "Spring 2024",
        syllabus: "https://cs51.io/",
      },
      {
        courseCode: "CS91r",
        title: "Supervised Research",
        description: "Supervised original research and reading in computer science.",
        instructor: "Various Faculty",
        concentration: "Computer Science",
        genedCategory: null,
        difficulty: 3.0,
        workload: 10,
        classSize: "Small",
        classSizeNumber: 1,
        timeSlot: "Flexible Timing",
        location: "By arrangement",
        qGuideRating: 4.6,
        prerequisites: "Permission of instructor",
        tags: ["Permission Required"],
        semester: "Fall 2023",
        syllabus: null,
      },
      {
        courseCode: "ECON1010a",
        title: "Intermediate Microeconomics",
        description: "Consumer and producer theory, competitive and monopolistic markets, and market failures.",
        instructor: "Edward Glaeser",
        concentration: "Economics",
        genedCategory: null,
        difficulty: 3.8,
        workload: 8,
        classSize: "Large",
        classSizeNumber: 300,
        timeSlot: "Mon/Wed/Fri 10-11am",
        location: "Science Center Hall C",
        qGuideRating: 4.1,
        prerequisites: "ECON 10a or equivalent",
        tags: ["Economics Concentration", "Required for Concentration"],
        semester: "Fall 2023",
        syllabus: null,
      },
      {
        courseCode: "HIST1300",
        title: "Western Intellectual History",
        description: "Survey of major themes in the intellectual history of Western civilization.",
        instructor: "James Hankins",
        concentration: "History",
        genedCategory: "Aesthetics & Culture",
        difficulty: 3.2,
        workload: 7,
        classSize: "Medium",
        classSizeNumber: 80,
        timeSlot: "Tue/Thu 10-11:30am",
        location: "CGIS South S010",
        qGuideRating: 4.5,
        prerequisites: null,
        tags: ["GenEd Eligible", "Writing Intensive"],
        semester: "Spring 2024",
        syllabus: null,
      }
    ];
    
    sampleCourses.forEach(course => {
      this.createCourse(course);
    });
  }
}

export const storage = new MemStorage();
