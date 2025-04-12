import { users, type User, type InsertUser, Course, InsertCourse, ChatMessage, InsertChatMessage, SavedCourse, InsertSavedCourse, FilterPreference, InsertFilterPreference } from "@shared/schema";

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
      (course) => course.courseCode === courseCode,
    );
  }
  
  async getAllCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }
  
  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = this.currentCourseId++;
    const course: Course = { ...insertCourse, id };
    this.courses.set(id, course);
    return course;
  }
  
  async searchCourses(filters: Record<string, any>): Promise<Course[]> {
    let courses = Array.from(this.courses.values());
    
    // Apply filters
    if (filters) {
      if (filters.concentration) {
        courses = courses.filter(course => course.concentration === filters.concentration);
      }
      
      if (filters.genedCategory) {
        courses = courses.filter(course => course.genedCategory === filters.genedCategory);
      }
      
      if (filters.difficultyRating) {
        courses = courses.filter(course => (course.difficultyRating || 0) >= filters.difficultyRating);
      }
      
      if (filters.qRating) {
        courses = courses.filter(course => (course.qRating || 0) >= filters.qRating);
      }
      
      if (filters.workloadRating) {
        // Convert workload hours to a rating scale for filtering
        courses = courses.filter(course => (course.workloadHours || 0) / 3 >= filters.workloadRating);
      }
      
      if (filters.noFriday === true) {
        courses = courses.filter(course => !course.hasFridayClasses);
      }
      
      if (filters.classSize) {
        switch (filters.classSize) {
          case 'small':
            courses = courses.filter(course => (course.classSize || 0) < 30);
            break;
          case 'medium':
            courses = courses.filter(course => (course.classSize || 0) >= 30 && (course.classSize || 0) < 100);
            break;
          case 'large':
            courses = courses.filter(course => (course.classSize || 0) >= 100);
            break;
        }
      }
      
      if (filters.professor) {
        courses = courses.filter(course => 
          course.professor.toLowerCase().includes(filters.professor.toLowerCase())
        );
      }
      
      // Time of day filters
      if (filters.morning === true) {
        courses = courses.filter(course => 
          course.schedule?.toLowerCase().includes('am') || 
          course.schedule?.match(/\b([7-9]|1[0-1])\b/) // 7am-11am
        );
      }
      
      if (filters.afternoon === true) {
        courses = courses.filter(course => 
          (course.schedule?.toLowerCase().includes('pm') && 
           course.schedule?.match(/\b([1-4])\b/)) || // 1pm-4pm
          course.schedule?.match(/\b(1[2-9])\b/) // 12pm-1pm
        );
      }
      
      if (filters.evening === true) {
        courses = courses.filter(course => 
          course.schedule?.toLowerCase().includes('pm') && 
          course.schedule?.match(/\b([5-9]|1[0-1])\b/) // 5pm-11pm
        );
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
    const message: ChatMessage = { ...insertMessage, id, timestamp };
    this.chatMessages.set(id, message);
    return message;
  }
  
  // Saved courses methods
  async getSavedCourses(userId: number): Promise<Course[]> {
    const savedCourseEntries = Array.from(this.savedCourses.values())
      .filter(savedCourse => savedCourse.userId === userId);
    
    const courseIds = savedCourseEntries.map(entry => entry.courseId);
    
    return Array.from(this.courses.values())
      .filter(course => courseIds.includes(course.id));
  }
  
  async saveCourse(insertSavedCourse: InsertSavedCourse): Promise<SavedCourse> {
    const id = this.currentSavedCourseId++;
    const timestamp = new Date();
    const savedCourse: SavedCourse = { ...insertSavedCourse, id, timestamp };
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
    const filterPreference: FilterPreference = { ...insertFilterPreference, id, timestamp };
    this.filterPreferences.set(id, filterPreference);
    return filterPreference;
  }
  
  // Initialize sample data
  private initSampleData() {
    // Sample user
    this.createUser({
      username: 'harvard_student',
      password: 'password123'
    });
    
    // Sample courses
    this.createCourse({
      courseCode: 'CS50',
      title: 'Introduction to Computer Science',
      description: 'An introduction to the intellectual enterprises of computer science and the art of programming.',
      professor: 'David Malan',
      concentration: 'Computer Science',
      schedule: 'Mon/Wed 10-11:30am',
      location: 'Sanders Theatre',
      prerequisites: 'None',
      classSize: 300,
      term: 'Fall 2023',
      qRating: 4.8,
      difficultyRating: 3.5,
      workloadHours: 9,
      hasFridayClasses: false,
      metadata: {
        comments: [
          {
            text: "Best course I've taken at Harvard. Professor Malan is engaging and the content is challenging but rewarding.",
            source: "Class of 2023"
          },
          {
            text: "The problem sets take time but they're designed well. TFs are super helpful during office hours.",
            source: "Class of 2024"
          }
        ]
      }
    });
    
    this.createCourse({
      courseCode: 'CS121',
      title: 'Introduction to Theory of Computation',
      description: 'Formal models of computation, computability, and complexity: finite automata, regular languages, Turing machines, undecidability, and NP-completeness.',
      professor: 'Salil Vadhan',
      concentration: 'Computer Science',
      schedule: 'Tue/Thu 1:30-3pm',
      location: 'Maxwell Dworkin G115',
      prerequisites: 'CS20 or equivalent',
      classSize: 75,
      term: 'Fall 2023',
      qRating: 4.5,
      difficultyRating: 4.2,
      workloadHours: 12,
      hasFridayClasses: false,
      metadata: {}
    });
    
    this.createCourse({
      courseCode: 'CS182',
      title: 'Artificial Intelligence',
      description: 'Design and analysis of efficient algorithms for AI applications, including search, planning, knowledge representation, and machine learning.',
      professor: 'Stuart Shieber',
      concentration: 'Computer Science',
      schedule: 'Mon/Wed 3-4:30pm',
      location: 'Pierce Hall 209',
      prerequisites: 'CS51 and preferably CS124',
      classSize: 120,
      term: 'Fall 2023',
      qRating: 4.3,
      difficultyRating: 3.8,
      workloadHours: 10,
      hasFridayClasses: false,
      metadata: {}
    });

    this.createCourse({
      courseCode: 'ECON10A',
      title: 'Principles of Economics',
      description: 'Introduction to economic analysis and its applications.',
      professor: 'Jason Furman',
      concentration: 'Economics',
      schedule: 'Mon/Wed/Fri 10-11am',
      location: 'Science Center Hall C',
      prerequisites: 'None',
      classSize: 240,
      term: 'Fall 2023',
      qRating: 4.1,
      difficultyRating: 3.2,
      workloadHours: 7,
      hasFridayClasses: true,
      metadata: {}
    });

    this.createCourse({
      courseCode: 'HIST1003',
      title: 'American Revolutions',
      description: 'Examines the revolutions that made America, from the 1770s to the 1860s.',
      professor: 'Jane Kamensky',
      concentration: 'History',
      schedule: 'Tue/Thu 10:30am-12pm',
      location: 'Emerson Hall 105',
      prerequisites: 'None',
      classSize: 85,
      term: 'Fall 2023',
      qRating: 4.6,
      difficultyRating: 2.8,
      workloadHours: 8,
      hasFridayClasses: false,
      metadata: {}
    });

    this.createCourse({
      courseCode: 'GENED1058',
      title: 'Tech Ethics',
      description: 'Explores the ethical implications of modern technology in society.',
      professor: 'Michael Sandel',
      concentration: null,
      genedCategory: 'Ethics & Civics',
      schedule: 'Mon/Wed 1-2:30pm',
      location: 'Sever Hall 113',
      prerequisites: 'None',
      classSize: 180,
      term: 'Fall 2023',
      qRating: 4.7,
      difficultyRating: 2.5,
      workloadHours: 6,
      hasFridayClasses: false,
      metadata: {}
    });

    this.createCourse({
      courseCode: 'GENED1036',
      title: 'Science and Cooking',
      description: 'Introduction to soft matter science using examples from cooking.',
      professor: 'David Weitz',
      concentration: null,
      genedCategory: 'Science & Technology',
      schedule: 'Tue/Thu/Fri 12-1pm',
      location: 'Science Center Hall B',
      prerequisites: 'None',
      classSize: 160,
      term: 'Fall 2023',
      qRating: 4.4,
      difficultyRating: 2.2,
      workloadHours: 5,
      hasFridayClasses: true,
      metadata: {}
    });

    this.createCourse({
      courseCode: 'MATH21A',
      title: 'Multivariable Calculus',
      description: 'Vectors in 2- and 3-space, partial derivatives, and multiple integrals.',
      professor: 'Oliver Knill',
      concentration: 'Mathematics',
      schedule: 'Mon/Wed/Fri 9-10am',
      location: 'Science Center Hall D',
      prerequisites: 'MATH1B or equivalent',
      classSize: 130,
      term: 'Fall 2023',
      qRating: 3.9,
      difficultyRating: 4.0,
      workloadHours: 11,
      hasFridayClasses: true,
      metadata: {}
    });
  }
}

export const storage = new MemStorage();
