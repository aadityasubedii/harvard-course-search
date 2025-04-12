import { Course } from '@shared/schema';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  courses?: Course[];
  timestamp?: Date;
}

export interface Filter {
  concentration?: string;
  genedCategory?: string;
  difficultyRating?: number;
  workloadRating?: number;
  morning?: boolean;
  afternoon?: boolean;
  evening?: boolean;
  noFriday?: boolean;
  classSize?: 'small' | 'medium' | 'large';
  professor?: string;
}

export interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  addMessage: (message: ChatMessage) => void;
  setIsTyping: (isTyping: boolean) => void;
  clearMessages: () => void;
}

export interface CourseState {
  selectedCourse: Course | null;
  savedCourses: Course[];
  cartCourses: Course[];
  setSelectedCourse: (course: Course | null) => void;
  addSavedCourse: (course: Course) => void;
  removeSavedCourse: (courseId: number) => void;
  addCartCourse: (course: Course) => void;
  removeCartCourse: (courseId: number) => void;
}

export interface FilterState {
  filters: Filter;
  setFilter: (key: string, value: any) => void;
  removeFilter: (key: string) => void;
  resetFilters: () => void;
}
