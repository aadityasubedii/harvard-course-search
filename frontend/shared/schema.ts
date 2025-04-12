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

// Course table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  courseCode: text("course_code").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  professor: text("professor").notNull(),
  concentration: text("concentration"),
  genedCategory: text("gened_category"),
  schedule: text("schedule"),
  location: text("location"),
  prerequisites: text("prerequisites"),
  classSize: integer("class_size"),
  term: text("term"),
  qRating: real("q_rating"),
  difficultyRating: real("difficulty_rating"),
  workloadHours: integer("workload_hours"),
  hasFridayClasses: boolean("has_friday_classes").default(false),
  credits: integer("credits").default(4),
  metadata: json("metadata").$type<Record<string, any>>(),
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
