import { Request, Response } from 'express';
import { LLMService, QuestionCounts } from './llmService';
import { validateQuiz, formatZodError } from './validation';
import { QuizRepository } from './quizRepository';

export class QuizController {
    private llmService: LLMService;
    private quizRepository: QuizRepository;

    constructor() {
        this.llmService = new LLMService();
        this.quizRepository = new QuizRepository();
    }

    generateQuiz = async (req: Request, res: Response): Promise<void> => {
        try {
            const { topic, questionCount, multipleChoice, multipleSelect, shortAnswer, paragraph, apiKey } = req.body;

            if (!topic) {
                res.status(400).json({ 
                    success: false,
                    error: 'Topic is required' 
                });
                return; // Added return to prevent further execution
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

            if(!validationResult.valid || !validationResult.validatedData) {
                console.error('Generated quiz failed Zod validation:');
                const errors = validationResult.errors ? formatZodError(validationResult.errors) : ['Validation failed'];
                errors.forEach(error => console.error(error));

                res.status(400).json({
                    success: false,
                    error: 'Generated quiz failed Zod validation',
                    validationErrors: errors,
                    quiz: quiz // Return invalid quiz for debugging
                });
                return; // Added return to prevent further execution
            }

            const validatedQuiz = validationResult.validatedData;

            // Save quiz to database
            try {
                const quizId = await this.quizRepository.saveQuiz(validatedQuiz, topic);
                console.log(`Quiz saved to database with ID: ${quizId}`);
                
                res.json({
                    success: true,
                    quiz: validatedQuiz,
                    quizId: quizId
                });
            } catch (dbError) {
                console.error('Error saving quiz to database:', dbError);
                // Still return the quiz even if database save fails
                res.json({
                    success: true,
                    quiz: validatedQuiz,
                    databaseError: 'Failed to save quiz to database'
                });
            }
            
        } catch (error : any) {
            console.error('Error generating quiz:', error.message);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    // Add a new endpoint to retrieve a quiz by its ID
    getQuiz = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            
            if (!id) {
                res.status(400).json({
                    success: false,
                    error: 'Quiz ID is required'
                });
                return;
            }
            
            const quiz = await this.quizRepository.getQuizById(id);
            
            if (!quiz) {
                res.status(404).json({
                    success: false,
                    error: 'Quiz not found'
                });
                return;
            }
            
            res.json({
                success: true,
                quiz
            });
        } catch (error: any) {
            console.error('Error retrieving quiz:', error.message);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Add a new endpoint to retrieve all quizzes
    getAllQuizzes = async (req: Request, res: Response): Promise<void> => {
        try {
            const quizzes = await this.quizRepository.getAllQuizzes();
            
            res.json({
                success: true,
                quizzes
            });
        } catch (error: any) {
            console.error('Error retrieving quizzes:', error.message);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

