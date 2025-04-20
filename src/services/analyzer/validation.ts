import {z} from 'zod';

// Reusable base schema for both multiple choice and multiple select questions
const MultipleChoiceBase = z.object({
    type: z.literal('multiple_choice'),
    title: z.string(),
    required: z.boolean(),
    options: z.array(z.string()),
    points: z.number().min(0),
    isMultiSelect: z.boolean().optional(),
}).and(
    z.union([
        z.object({ correctAnswer: z.string() }),
        z.object({ correctAnswers: z.array(z.string()) }),
    ])
);


const ParagraphQues = z.object({
    type: z.literal('paragraph'),
    title: z.string(),
    required: z.boolean(),
    points: z.number().min(0),
});

const ShortAnswerQues = z.object({
    type: z.literal('short_answer'),
    title: z.string(),
    required: z.boolean(),
    correctAnswer: z.string(),
    points: z.number().min(0),
});

export const QuesSchema = z.union([
    MultipleChoiceBase,
    ParagraphQues,
    ShortAnswerQues,
]);

export const QuizSchema = z.object({
    quizTitle: z.string(),
    description: z.string(),
    questions: z.array(QuesSchema),
});

export type Quiz = z.infer<typeof QuizSchema>;

export type Question = z.infer<typeof QuesSchema>;

export function validateQuiz(data : unknown): {
    valid: boolean;
    validatedData?: Quiz;
    error?: z.ZodError;
} {
    try {
        const validatedData = QuizSchema.parse(data);
        return {
            valid: true,
            validatedData,
        };
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return {
                valid: false,
                error: error,
            };
        }
        throw error;   
    }
}

export function validateQuestion(data : unknown): {
    valid: boolean;
    validatedData?: Question;
    error?: z.ZodError;
} {
    try {
        const validatedData = QuesSchema.parse(data);
        return {
            valid: true,
            validatedData,
        }
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return {
                valid: false,
                error: error,
            };
        }
        throw error;
    }
}

export function formatZodError(error : z.ZodError): string[] {
    return error.errors.map(err => {
        const path = err.path.join('.');
        return `${path ? `${path}: ` : ''}${err.message}`;
    })
}