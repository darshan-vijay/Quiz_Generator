CREATE TABLE "question" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"options" text[] DEFAULT '{}'::text[],
	"correct_answer" text,
	"correct_answers" text[] DEFAULT '{}'::text[],
	"is_multiple_select" boolean DEFAULT false,
	"required" boolean DEFAULT true NOT NULL,
	"points" integer NOT NULL,
	CONSTRAINT "question_id_unique" UNIQUE("id")
);
