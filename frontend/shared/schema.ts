import { pgTable, text, serial, integer, real, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table (kept from original schema)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Course schema
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  courseCode: text("course_code").notNull().unique(), // e.g., CS50
  title: text("title").notNull(),
  description: text("description").notNull(),
  instructor: text("instructor").notNull(),
  concentration: text("concentration").notNull(),
  genedCategory: text("gened_category"),
  difficulty: real("difficulty"), // Q Guide rating (1-5)
  workload: integer("workload"), // hours per week
  classSize: text("class_size").notNull(), // Small, Medium, Large
  classSizeNumber: integer("class_size_number"), // Actual number of students
  timeSlot: text("time_slot").notNull(), // e.g., "Mon/Wed 3-4:30pm"
  location: text("location"),
  qGuideRating: real("q_guide_rating"), // Overall Q Guide rating (1-5)
  prerequisites: text("prerequisites"),
  tags: text("tags").array(), // Additional tags like "GenEd Eligible", "No Prerequisites"
  semester: text("semester").notNull(), // e.g., "Fall 2023"
  syllabus: text("syllabus"), // Link to syllabus
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
});

// Chat messages schema
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  role: text("role").notNull(), // "user" or "assistant"
  content: text("content").notNull(),
  timestamp: text("timestamp").notNull(),
  sessionId: text("session_id").notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
});

// Saved courses schema
export const savedCourses = pgTable("saved_courses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  savedAt: text("saved_at").notNull(),
  notes: text("notes"),
});

export const insertSavedCourseSchema = createInsertSchema(savedCourses).omit({
  id: true,
});

// Filter settings schema (for saving user filter preferences)
export const filterSettings = pgTable("filter_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  settings: jsonb("settings").notNull(),
  createdAt: text("created_at").notNull(),
});

export const insertFilterSettingsSchema = createInsertSchema(filterSettings).omit({
  id: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type SavedCourse = typeof savedCourses.$inferSelect;
export type InsertSavedCourse = z.infer<typeof insertSavedCourseSchema>;

export type FilterSetting = typeof filterSettings.$inferSelect;
export type InsertFilterSetting = z.infer<typeof insertFilterSettingsSchema>;
