import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Course, CourseFilters } from "@/types";
import { apiRequest } from "@/lib/queryClient";

export function useCourses() {
  const queryClient = useQueryClient();

  const allCoursesQuery = useQuery({
    queryKey: ["/api/courses"],
  });

  const getFilteredCourses = (filters: CourseFilters) => {
    return useQuery({
      queryKey: ["/api/courses/filter", filters],
      queryFn: async () => {
        const res = await apiRequest("POST", "/api/courses/filter", filters);
        return res.json();
      },
      enabled: Object.values(filters).some(value => {
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        if (typeof value === "object" && value !== null) {
          return Object.values(value).some(v => v !== undefined);
        }
        return value !== undefined;
      }),
    });
  };

  const getCourse = (id: number) => {
    return useQuery({
      queryKey: ["/api/courses", id],
      enabled: id !== undefined,
    });
  };

  const getSavedCourses = (userId?: number) => {
    return useQuery({
      queryKey: ["/api/saved-courses", userId],
      enabled: !!userId,
    });
  };

  const saveCourse = useMutation({
    mutationFn: async (data: { userId: number; courseId: number; notes?: string }) => {
      const response = await apiRequest("POST", "/api/saved-courses", {
        userId: data.userId,
        courseId: data.courseId,
        savedAt: new Date().toISOString(),
        notes: data.notes || null,
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-courses", variables.userId] });
    },
  });

  const removeSavedCourse = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/saved-courses/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-courses"] });
    },
  });

  return {
    allCoursesQuery,
    getFilteredCourses,
    getCourse,
    getSavedCourses,
    saveCourse,
    removeSavedCourse,
  };
}
