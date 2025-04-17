import {
  uuid,
  integer,
  text,
  boolean,
  pgTable,
  PgArray,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// "title": "What is the capital of France?",
//       "required": true,
//       "options": ["Paris", "London", "Berlin", "Madrid"],
//       "correctAnswer": "Paris",
//       "points": 1

export const question = pgTable("question", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),

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
