import { create } from 'zustand';
import { CourseState } from '@/lib/types';
import { Course } from '@shared/schema';

export const useCourseStore = create<CourseState>((set) => ({
  selectedCourse: null,
  savedCourses: [],
  cartCourses: [],
  
  setSelectedCourse: (course: Course | null) => set({ selectedCourse: course }),
  
  addSavedCourse: (course: Course) => set((state) => ({
    savedCourses: state.savedCourses.some(c => c.id === course.id) 
      ? state.savedCourses 
      : [...state.savedCourses, course]
  })),
  
  removeSavedCourse: (courseId: number) => set((state) => ({
    savedCourses: state.savedCourses.filter(course => course.id !== courseId)
  })),
  
  addCartCourse: (course: Course) => set((state) => ({
    cartCourses: state.cartCourses.some(c => c.id === course.id) 
      ? state.cartCourses 
      : [...state.cartCourses, course]
  })),
  
  removeCartCourse: (courseId: number) => set((state) => ({
    cartCourses: state.cartCourses.filter(course => course.id !== courseId)
  }))
}));
