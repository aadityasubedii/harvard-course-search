export interface Course {
  id: number;
  courseCode: string;
  title: string;
  description: string;
  instructor: string;
  concentration: string;
  genedCategory: string | null;
  difficulty: number | null;
  workload: number | null;
  classSize: string;
  classSizeNumber: number | null;
  timeSlot: string;
  location: string | null;
  qGuideRating: number | null;
  prerequisites: string | null;
  tags: string[] | null;
  semester: string;
  syllabus: string | null;
}

export interface ChatMessage {
  id: number;
  userId?: number | null;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sessionId: string;
}

export interface SavedCourse {
  id: number;
  userId: number;
  courseId: number;
  savedAt: string;
  notes: string | null;
  course?: Course;
}

export interface FilterSettings {
  id: number;
  userId: number;
  name: string;
  settings: CourseFilters;
  createdAt: string;
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

export interface ChatbotResponse {
  message: ChatMessage;
  suggestedCourses: Course[];
  filterSuggestions: Record<string, any>;
}
