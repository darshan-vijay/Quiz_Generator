import { db } from '@database/drizzle';
import { quiz, question, QuizTable, QuestionTable } from '@database/schema';
import { Quiz, Question } from './validation';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

export class QuizRepository {
    /**
     * Save a quiz and its questions to the database
     * @param quizData The validated quiz data
     * @param topic The topic of the quiz
     * @returns The ID of the saved quiz
     */
    async saveQuiz(quizData: Quiz, topic: string): Promise<string> {
        try {
            // Generate a UUID for the quiz
            const quizId = uuidv4();
            
            // Insert the quiz into the database
            await db.insert(quiz).values({
                id: quizId,
                title: quizData.quizTitle,
                description: quizData.description,
                topic: topic
            });
            
            // Insert each question with a reference to the quiz
            const questionInsertPromises = quizData.questions.map(async (q) => {
                const questionValues: any = {
                    quizId: quizId,
                    type: q.type,
                    title: q.title,
                    required: q.required,
                    points: q.points
                };
                
                if (q.type === 'multiple_choice') {
                    questionValues.options = q.options;
                    questionValues.isMultiSelect = q.isMultiSelect || false;
                    
                    if ('correctAnswers' in q && q.correctAnswers) {
                        questionValues.correctAnswers = q.correctAnswers;
                    } else if ('correctAnswer' in q && q.correctAnswer) {
                        questionValues.correctAnswer = q.correctAnswer;
                    }
                } else if (q.type === 'short_answer' && 'correctAnswer' in q) {
                    questionValues.correctAnswer = q.correctAnswer;
                }
                
                await db.insert(question).values(questionValues);
            });
            
            // Wait for all questions to be inserted
            await Promise.all(questionInsertPromises);
            
            return quizId;
        } catch (error) {
            console.error('Error saving quiz to database:', error);
            throw new Error('Failed to save quiz to database');
        }
    }
    
    /**
     * Retrieve a quiz by its ID
     * @param quizId The ID of the quiz to retrieve
     * @returns The quiz data or null if not found
     */
    async getQuizById(quizId: string): Promise<Quiz | null> {
        try {
            // Fetch the quiz
            const quizData = await db.select().from(quiz).where(eq(quiz.id, quizId));
            
            if (quizData.length === 0) {
                return null;
            }
            
            // Fetch the questions for this quiz
            const questions = await db.select().from(question).where(eq(question.quizId, quizId));
            
            // Map the database questions to the Quiz question format
            const formattedQuestions = questions.map((q: QuestionTable) => {
                let baseQuestion: Partial<Question> = {
                    type: q.type as any,
                    title: q.title,
                    required: q.required,
                    points: q.points
                };
                
                // Add type-specific properties
                if (q.type === 'multiple_choice') {
                    (baseQuestion as any).options = q.options;
                    (baseQuestion as any).isMultiSelect = q.isMultiSelect;
                    
                    if (q.isMultiSelect) {
                        (baseQuestion as any).correctAnswers = q.correctAnswers || [];
                    } else {
                        (baseQuestion as any).correctAnswer = q.correctAnswer || '';
                    }
                } else if (q.type === 'short_answer' && q.correctAnswer) {
                    (baseQuestion as any).correctAnswer = q.correctAnswer;
                }
                
                return baseQuestion as Question;
            });
            
            // Return the complete quiz
            return {
                quizTitle: quizData[0].title,
                description: quizData[0].description,
                questions: formattedQuestions
            };
        } catch (error) {
            console.error('Error retrieving quiz from database:', error);
            throw new Error('Failed to retrieve quiz from database');
        }
    }
    
    /**
     * Retrieve all quizzes from the database
     * @returns An array of quizzes with basic information
     */
    async getAllQuizzes(): Promise<{ id: string, title: string, description: string, topic: string, createdAt: Date }[]> {
        try {
            // Fetch all quizzes
            const quizzes = await db.select({
                id: quiz.id,
                title: quiz.title,
                description: quiz.description,
                topic: quiz.topic,
                createdAt: quiz.createdAt
            }).from(quiz);
            
            return quizzes;
        } catch (error) {
            console.error('Error retrieving all quizzes from database:', error);
            throw new Error('Failed to retrieve quizzes from database');
        }
    }
} 