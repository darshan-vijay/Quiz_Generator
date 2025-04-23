import {
  uuid,
  integer,
  text,
  boolean,
  pgTable,
  PgArray,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { InferSelectModel } from "drizzle-orm";

// Define the quiz table to store quiz metadata
export const quiz = pgTable("quiz", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  topic: text("topic").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// "title": "What is the capital of France?",
//       "required": true,
//       "options": ["Paris", "London", "Berlin", "Madrid"],
//       "correctAnswer": "Paris",
//       "points": 1

export const question = pgTable("question", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  quizId: uuid("quiz_id").references(() => quiz.id),
  type: text("type").notNull(),
  title: text("title").notNull(),

  options: text("options")
    .array()
    .default(sql`'{}'::text[]`),

  correctAnswer: text("correct_answer"),
  correctAnswers: text("correct_answers")
    .array()
    .default(sql`'{}'::text[]`),

  isMultiSelect: boolean("is_multiple_select").default(false),
  required: boolean("required").notNull().default(true),
  points: integer("points").notNull(),
});

// TypeScript types
export type QuizTable = InferSelectModel<typeof quiz>;
export type QuestionTable = InferSelectModel<typeof question>;
