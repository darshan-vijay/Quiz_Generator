import { QuizController } from '../services/analyzer/quizController';
import { Request, Response } from 'express';
import { QuizRepository } from '../services/analyzer/quizRepository';
import { LLMService } from '../services/analyzer/llmService';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

// Mock data
const mockQuizId = 'test-quiz-id';
const mockQuiz = {
    quizTitle: 'Test Quiz',
    description: 'A test quiz about testing',
    questions: [
        {
            type: 'multiple_choice',
            title: 'Test Question 1',
            required: true,
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 'A',
            points: 1,
            isMultiSelect: false
        }
    ]
};

// Mock request/response helpers
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
    let mockQuizRepository: QuizRepository;
    let mockLLMService: LLMService;

    beforeAll(async () => {
        mockQuizRepository = {
            saveQuiz: vi.fn().mockResolvedValue(mockQuizId),
            getQuizById: vi.fn().mockImplementation((id: string) => {
                return id === mockQuizId 
                    ? Promise.resolve(mockQuiz)
                    : Promise.resolve(null);
            }),
            getAllQuizzes: vi.fn().mockResolvedValue([{
                id: mockQuizId,
                title: mockQuiz.quizTitle,
                description: mockQuiz.description,
                topic: 'Test Topic',
                createdAt: new Date()
            }])
        } as unknown as QuizRepository;

        mockLLMService = {
            generateQuiz: vi.fn().mockResolvedValue(mockQuiz)
        } as unknown as LLMService;

        quizController = new QuizController();
        (quizController as any).llmService = mockLLMService;
        (quizController as any).quizRepository = mockQuizRepository;
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterAll(async () => {
        vi.clearAllMocks();
    });

    describe('generateQuiz', () => {
        it('should generate a quiz with default parameters', async () => {
            const req = mockRequest({
                topic: 'Test Topic',
                questionCount: 5,
                apiKey: 'test-api-key'
            });
            const res = mockResponse();

            await quizController.generateQuiz(req, res);

            expect(res.status).not.toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                quiz: mockQuiz,
                quizId: mockQuizId
            });
            expect(mockQuizRepository.saveQuiz).toHaveBeenCalledWith(mockQuiz, 'Test Topic');
        });

        it('should return error when topic is missing', async () => {
            const req = mockRequest({
                questionCount: 5,
                apiKey: 'test-api-key'
            });
            const res = mockResponse();

            await quizController.generateQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Topic is required'
            });
            expect(mockQuizRepository.saveQuiz).not.toHaveBeenCalled();
        });

        it('should return error when API key is missing', async () => {
            const req = mockRequest({
                topic: 'Test Topic',
                questionCount: 5
            });
            const res = mockResponse();

            await quizController.generateQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'API Key is required'
            });
            expect(mockQuizRepository.saveQuiz).not.toHaveBeenCalled();
        });

        it('should return error when question counts exceed total', async () => {
            const req = mockRequest({
                topic: 'Test Topic',
                questionCount: 5,
                apiKey: 'test-api-key',
                multipleChoice: 3,
                multipleSelect: 3
            });
            const res = mockResponse();

            await quizController.generateQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Total specified question counts (6) exceeds the total requested (5)'
            });
            expect(mockQuizRepository.saveQuiz).not.toHaveBeenCalled();
        });

        it('should handle specific question type counts', async () => {
            const req = mockRequest({
                topic: 'Test Topic',
                questionCount: 5,
                apiKey: 'test-api-key',
                multipleChoice: 2,
                multipleSelect: 1,
                shortAnswer: 1,
                paragraph: 1
            });
            const res = mockResponse();

            await quizController.generateQuiz(req, res);

            expect(res.status).not.toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                quiz: mockQuiz,
                quizId: mockQuizId
            });
            expect((quizController as any).llmService.generateQuiz).toHaveBeenCalledWith(
                'Test Topic',
                5,
                'test-api-key',
                {
                    multipleChoice: 2,
                    multipleSelect: 1,
                    shortAnswer: 1,
                    paragraph: 1
                }
            );
        });
    });

    describe('getQuiz', () => {
        it('should retrieve a quiz by ID', async () => {
            const req = mockRequest({}, { id: mockQuizId });
            const res = mockResponse();

            await quizController.getQuiz(req, res);

            expect(res.status).not.toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                quiz: mockQuiz
            });
            expect(mockQuizRepository.getQuizById).toHaveBeenCalledWith(mockQuizId);
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
            expect(mockQuizRepository.getQuizById).not.toHaveBeenCalled();
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
            expect(mockQuizRepository.getQuizById).toHaveBeenCalledWith('non-existent-id');
        });
    });

    describe('getAllQuizzes', () => {
        it('should retrieve all quizzes', async () => {
            const req = mockRequest();
            const res = mockResponse();

            await quizController.getAllQuizzes(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                quizzes: [{
                    id: mockQuizId,
                    title: mockQuiz.quizTitle,
                    description: mockQuiz.description,
                    topic: 'Test Topic',
                    createdAt: expect.any(Date)
                }]
            });
            expect(mockQuizRepository.getAllQuizzes).toHaveBeenCalled();
        });
    });
});
