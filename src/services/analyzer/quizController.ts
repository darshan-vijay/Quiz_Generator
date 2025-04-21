import { Request, Response } from 'express';
import { LLMService, QuestionCounts } from './llmService';
import { validateQuiz, formatZodError } from './validation';

export class QuizController {
    private llmService: LLMService;

    constructor() {
        this.llmService = new LLMService();
    }

    generateQuiz = async (req: Request, res: Response): Promise<void> => {
        try {
            const { topic, questionCount, multipleChoice, multipleSelect, shortAnswer, paragraph, apiKey } = req.body;

            if (!topic) {
                res.status(400).json({ 
                    success: false,
                    error: 'Topic is required' 
                });
            }

            const count = questionCount || 5;

            const hasCategorySpecified = multipleChoice !== undefined || 
                                        multipleSelect !== undefined || 
                                        shortAnswer !== undefined || 
                                        paragraph !== undefined;

            let questionCounts: QuestionCounts | undefined;

            if (hasCategorySpecified) {
                questionCounts = {}

                if (multipleChoice !== undefined) {
                    questionCounts.multipleChoice = Number(multipleChoice);
                }

                if (multipleSelect !== undefined) {
                    questionCounts.multipleSelect = Number(multipleSelect);
                }

                if (shortAnswer !== undefined) {
                    questionCounts.shortAnswer = Number(shortAnswer);
                }

                if (paragraph !== undefined) {
                    questionCounts.paragraph = Number(paragraph);
                }

                const totalSpecified = Object.values(questionCounts)
                    .reduce((sum, count) => sum + (count || 0), 0);

                if (totalSpecified != count) {
                   console.warn(`Total specified question counts (${totalSpecified}) does not match the total requested (${count}). Adjusting counts to match the total.`);
                }
            }

            const quiz = await this.llmService.generateQuiz(topic, count, apiKey, questionCounts);

            const validationResult = validateQuiz(quiz);

            if(!validationResult.valid) {
                console.error('Generated quiz failed Zod validation:');
                const errors = formatZodError(validationResult.errors!);
                errors.forEach(error => console.error(error));

                res.status(400).json({
                    success: false,
                    error: 'Generated quiz failed Zod validation',
                    validationErrors: errors,
                    quiz: quiz // Return invalid quiz for debugging
                });
            }

            const validatedQuiz = validationResult.validatedData;

            // TODO: Save quiz to database

            res.json({
                success: true,
                quiz: validatedQuiz
            });
            
        } catch (error : any) {
            console.error('Error generating quiz:', error.message);
            res.status(500).json({
                success: false,
                error: error.message
            })
        }
    }
}

