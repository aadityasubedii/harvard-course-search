import { pgTable, text, serial, integer, boolean, json, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table from the original schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Course table based on QGuide scraped data format
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  course_id: text("course_id").notNull().unique(), // Matches scraped course_id format
  title: text("title").notNull(),
  professor: text("professor").notNull(),
  qrating: real("qrating"), // Matches scraped qrating format
  course_description: text("course_description"), // Matches scraped format
  average_workload: text("average_workload"), // Text format like "12 hours per week"
  class_size: integer("class_size"),
  gen_eds: json("gen_eds").$type<string[]>(), // Array of GenEd codes
  qguide_reviews: json("qguide_reviews").$type<string[]>(), // Array of review comments
  // Additional fields we might need for filtering or display
  schedule: text("schedule"), // For calendar export
  concentration: text("concentration"), // For filtering by department
  term: text("term").default("Fall 2023"), // Current term
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
});

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Saved courses table
export const savedCourses = pgTable("saved_courses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  courseId: integer("course_id").references(() => courses.id),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertSavedCourseSchema = createInsertSchema(savedCourses).omit({
  id: true,
  timestamp: true,
});

export type InsertSavedCourse = z.infer<typeof insertSavedCourseSchema>;
export type SavedCourse = typeof savedCourses.$inferSelect;

// Filter preferences
export const filterPreferences = pgTable("filter_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  filters: json("filters").$type<Record<string, any>>(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertFilterPreferenceSchema = createInsertSchema(filterPreferences).omit({
  id: true,
  timestamp: true,
});

export type InsertFilterPreference = z.infer<typeof insertFilterPreferenceSchema>;
export type FilterPreference = typeof filterPreferences.$inferSelect;
