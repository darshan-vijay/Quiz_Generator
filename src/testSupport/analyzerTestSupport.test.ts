import { QuizController } from '../services/analyzer/quizController';
import { Request, Response } from 'express';
import { testDbTemplate, TestDatabaseTemplate } from './databaseTestSupport';
import { QuizRepository } from '../services/analyzer/quizRepository';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

const mockRequest = (body: any = {}, params: any = {}): Request => ({
    body,
    params,
} as Request);

const mockResponse = (): Response => {
    const res = {} as Response;
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

describe('QuizController', () => {
    let quizController: QuizController;
    let testDb: TestDatabaseTemplate;
    let quizRepository: QuizRepository;

    beforeAll(async () => {
        testDb = await testDbTemplate('quiz_controller_test');
        quizRepository = new QuizRepository();
        quizController = new QuizController();
    });

    afterAll(async () => {
        await testDb.clear();
    });

    describe('generateQuiz', () => {
        it('should generate a quiz with default parameters', async () => {
            const req = mockRequest({
                topic: 'Test Topic',
                questionCount: 5
            });
            const res = mockResponse();

            await quizController.generateQuiz(req, res);

            expect(res.status).not.toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    quiz: expect.any(Object),
                    quizId: expect.any(String)
                })
            );
        });

        it('should generate a quiz with specific question types', async () => {
            const req = mockRequest({
                topic: 'Test Topic',
                questionCount: 5,
                multipleChoice: 2,
                multipleSelect: 1,
                shortAnswer: 1,
                paragraph: 1
            });
            const res = mockResponse();

            await quizController.generateQuiz(req, res);

            expect(res.status).not.toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    quiz: expect.any(Object),
                    quizId: expect.any(String)
                })
            );
        });

        it('should return error when topic is missing', async () => {
            const req = mockRequest({
                questionCount: 5
            });
            const res = mockResponse();

            await quizController.generateQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Topic is required'
            });
        });
    });

    describe('getQuiz', () => {
        it('should retrieve a quiz by ID', async () => {
            // First create a quiz to retrieve
            const createReq = mockRequest({
                topic: 'Test Topic for Get',
                questionCount: 2
            });
            const createRes = mockResponse();
            await quizController.generateQuiz(createReq, createRes);

            const quizId = (createRes.json as any).mock.calls[0][0].quizId;

            const req = mockRequest({}, { id: quizId });
            const res = mockResponse();

            await quizController.getQuiz(req, res);

            expect(res.status).not.toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    quiz: expect.any(Object)
                })
            );
        });

        it('should return error when quiz ID is missing', async () => {
            const req = mockRequest({}, {});
            const res = mockResponse();

            await quizController.getQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Quiz ID is required'
            });
        });

        it('should return error when quiz is not found', async () => {
            const req = mockRequest({}, { id: 'non-existent-id' });
            const res = mockResponse();

            await quizController.getQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Quiz not found'
            });
        });
    });

    describe('getAllQuizzes', () => {
        it('should retrieve all quizzes', async () => {
            // Create a few quizzes first
            for (let i = 0; i < 3; i++) {
                const req = mockRequest({
                    topic: `Test Topic ${i}`,
                    questionCount: 2
                });
                const res = mockResponse();
                await quizController.generateQuiz(req, res);
            }

            const req = mockRequest();
            const res = mockResponse();

            await quizController.getAllQuizzes(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    quizzes: expect.arrayContaining([
                        expect.objectContaining({
                            topic: expect.any(String),
                            questions: expect.any(Array)
                        })
                    ])
                })
            );
        });
    });
});
