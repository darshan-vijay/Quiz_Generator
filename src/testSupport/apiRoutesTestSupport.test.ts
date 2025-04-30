import { Request, Response } from 'express';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { 
  validateToken,
  getUserInfo,
  createForm,
  fetchQuestions,
  updateQuestion,
  addQuestion,
  setServices
} from '../services/server/apiRoutes';
import { GoogleAuthService } from '../services/server/googleFormAuthService';
import { GoogleFormsService } from '../services/server/googleFormService';

const mockToken = 'mock-token';
const mockUserInfo = {
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/avatar.jpg'
};

const mockQuizData = {
    title: 'Test Quiz',
    description: 'A test quiz',
    questions: [
        {
            type: 'multiple_choice',
            title: 'Test Question',
            required: true,
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 'A'
        }
    ]
};

const mockFormId = 'test-form-id';
const mockQuestionId = 'test-question-id';

const mockRequest = (body: any = {}, params: any = {}, headers: any = {}): Request => {
    const req = {
        body,
        params,
        headers: {
            authorization: `Bearer ${mockToken}`,
            ...headers
        }
    } as Request;
    
    // Pre-set the token if authorization header exists
    if (req.headers.authorization) {
        const token = req.headers.authorization.split(' ')[1];
        (req as any).token = token;
    }
    
    return req;
};

const mockResponse = (): Response => {
    const res = {} as Response;
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

describe('Google Form API Routes', () => {
    let mockAuthService: GoogleAuthService;
    let mockFormsService: GoogleFormsService;

    beforeAll(() => {
        mockAuthService = {
            fetchUserInfo: vi.fn().mockResolvedValue(mockUserInfo),
            decodeToken: vi.fn().mockReturnValue(mockUserInfo)
        } as unknown as GoogleAuthService;

        mockFormsService = {
            createForm: vi.fn().mockResolvedValue({ formId: mockFormId }),
            fetchQuestions: vi.fn().mockResolvedValue([{ id: mockQuestionId, title: 'Test Question' }]),
            updateQuestion: vi.fn().mockResolvedValue(undefined),
            addQuestion: vi.fn().mockResolvedValue(undefined)
        } as unknown as GoogleFormsService;

        // Set up mock services
        setServices(mockAuthService, mockFormsService);
    });

    afterAll(() => {
        vi.clearAllMocks();
    });

    describe('Token Validation', () => {
        it('should validate token when provided', () => {
            const req = mockRequest();
            const res = mockResponse();
            const next = vi.fn();

            validateToken(req, res, next);

            expect(next).toHaveBeenCalled();
            expect((req as any).token).toBe(mockToken);
        });

        it('should return 401 when no token is provided', () => {
            const req = mockRequest({}, {}, { authorization: undefined });
            const res = mockResponse();
            const next = vi.fn();

            validateToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'No authorization token provided' });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('GET /user-info', () => {
        it('should return user info when valid token is provided', async () => {
            const req = mockRequest();
            const res = mockResponse();

            await getUserInfo(req, res);

            expect(res.json).toHaveBeenCalledWith(mockUserInfo);
            expect(mockAuthService.fetchUserInfo).toHaveBeenCalledWith(mockToken);
        });
    });

    describe('POST /forms', () => {
        it('should create a form with valid data', async () => {
            const req = mockRequest({
                quizData: mockQuizData,
                selectedQuestions: [0, 1]
            });
            const res = mockResponse();

            await createForm(req, res);

            expect(res.json).toHaveBeenCalledWith({
                formId: mockFormId,
                logs: expect.any(Array)
            });
            expect(mockFormsService.createForm).toHaveBeenCalledWith(
                mockToken,
                mockQuizData,
                expect.any(Set),
                expect.any(Function)
            );
        });

        it('should return 400 when quiz data is missing', async () => {
            const req = mockRequest({
                selectedQuestions: [0, 1]
            });
            const res = mockResponse();

            await createForm(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Missing required quiz data or selected questions'
            });
        });
    });

    describe('GET /forms/:formId/questions', () => {
        it('should fetch questions for a valid form ID', async () => {
            const req = mockRequest({}, { formId: mockFormId });
            const res = mockResponse();

            await fetchQuestions(req, res);

            expect(res.json).toHaveBeenCalledWith([{ id: mockQuestionId, title: 'Test Question' }]);
            expect(mockFormsService.fetchQuestions).toHaveBeenCalledWith(mockToken, mockFormId);
        });

        it('should return 400 when form ID is missing', async () => {
            const req = mockRequest({}, {});
            const res = mockResponse();

            await fetchQuestions(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Missing form ID'
            });
        });
    });

    describe('PUT /forms/:formId/questions/:questionId', () => {
        it('should update a question with valid data', async () => {
            const req = mockRequest(
                { questionData: mockQuizData.questions[0], index: 0 },
                { formId: mockFormId, questionId: mockQuestionId }
            );
            const res = mockResponse();

            await updateQuestion(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });
            expect(mockFormsService.updateQuestion).toHaveBeenCalledWith(
                mockToken,
                mockFormId,
                mockQuestionId,
                mockQuizData.questions[0],
                0
            );
        });

        it('should return 400 when required parameters are missing', async () => {
            const req = mockRequest(
                { questionData: mockQuizData.questions[0] },
                { formId: mockFormId, questionId: mockQuestionId }
            );
            const res = mockResponse();

            await updateQuestion(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Missing required parameters'
            });
        });
    });

    describe('POST /forms/:formId/questions', () => {
        it('should add a new question with valid data', async () => {
            const req = mockRequest(
                { questionData: mockQuizData.questions[0] },
                { formId: mockFormId }
            );
            const res = mockResponse();

            await addQuestion(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                logs: expect.any(Array)
            });
            expect(mockFormsService.addQuestion).toHaveBeenCalledWith(
                mockToken,
                mockFormId,
                mockQuizData.questions[0],
                expect.any(Function)
            );
        });

        it('should return 400 when question data is missing', async () => {
            const req = mockRequest({}, { formId: mockFormId });
            const res = mockResponse();

            await addQuestion(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Missing required parameters'
            });
        });
    });
});
