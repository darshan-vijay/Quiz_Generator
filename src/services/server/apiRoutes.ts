import express, { Router, Request, Response, NextFunction } from 'express';
import { GoogleAuthService } from './googleFormAuthService';
import { GoogleFormsService, QuizData } from './googleFormService';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize services
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Service instances
let _authService: GoogleAuthService | null = null;
let _formsService: GoogleFormsService | null = null;

// Service getters
export const getAuthService = (): GoogleAuthService => {
  if (!_authService) {
    _authService = createAuthService();
  }
  return _authService;
};

export const getFormsService = (): GoogleFormsService => {
  if (!_formsService) {
    _formsService = new GoogleFormsService();
  }
  return _formsService;
};

// For testing
export const setServices = (auth: GoogleAuthService, forms: GoogleFormsService) => {
  _authService = auth;
  _formsService = forms;
};

function createAuthService(): GoogleAuthService {
  if (GOOGLE_CLIENT_ID) {
    return new GoogleAuthService({
      clientId: GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/forms.body',
      flow: 'implicit'
    });
  }
  
  // Mock auth service for testing
  return {
    config: {
      clientId: 'mock-client-id',
      scope: 'https://www.googleapis.com/auth/forms.body',
      flow: 'implicit'
    },
    decodeToken: (token: string) => ({
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg'
    }),
    fetchUserInfo: async (token: string) => ({
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg'
    }),
    handleLoginSuccess: async (credentialResponse: any, onSuccess: (token: string, userInfo: any) => void) => {
      const mockToken = 'mock-token';
      const mockUserInfo = {
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg'
      };
      onSuccess(mockToken, mockUserInfo);
    },
    handleLoginError: (error: any) => ({
      message: 'Mock error message',
      showTestingHelp: false
    }),
    getOAuthConfig: () => ({
      clientId: 'mock-client-id',
      scope: 'https://www.googleapis.com/auth/forms.body',
      flow: 'implicit'
    })
  } as unknown as GoogleAuthService;
}

// Middleware to validate token
export const validateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'No authorization token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'No authorization token provided' });
    return;
  }

  // Attach token to request for use in route handlers
  (req as any).token = token;
  next();
};

// Route handlers
export const getUserInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = (req as any).token;
    if (!token) {
      res.status(401).json({ error: 'No authorization token provided' });
      return;
    }
    const userInfo = await getAuthService().fetchUserInfo(token);
    if (!userInfo) {
      res.status(401).json({ error: 'Failed to fetch user information' });
      return;
    }
    res.json(userInfo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = (req as any).token;
    const { quizData, selectedQuestions } = req.body;
    
    if (!quizData || !selectedQuestions) {
      res.status(400).json({ error: 'Missing required quiz data or selected questions' });
      return;
    }

    // Convert selectedQuestions array to Set
    const questionsSet = new Set(selectedQuestions);
    
    // Array to capture logs
    const logs: string[] = [];
    const addLog = (message: string) => {
      logs.push(message);
      console.log(message);
    };

    const result = await getFormsService().createForm(
      token,
      quizData as QuizData,
      questionsSet as Set<number>,
      addLog
    );

    res.json({
      ...result,
      logs
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const fetchQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = (req as any).token;
    const { formId } = req.params;

    if (!formId) {
      res.status(400).json({ error: 'Missing form ID' });
      return;
    }

    const questions = await getFormsService().fetchQuestions(token, formId);
    res.json(questions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = (req as any).token;
    const { formId, questionId } = req.params;
    const { questionData, index } = req.body;

    if (!formId || !questionId || !questionData || index === undefined) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }

    await getFormsService().updateQuestion(
      token,
      formId,
      questionId,
      questionData,
      index
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const addQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = (req as any).token;
    const { formId } = req.params;
    const { questionData } = req.body;

    if (!formId || !questionData) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }

    // Array to capture logs
    const logs: string[] = [];
    const addLog = (message: string) => {
      logs.push(message);
      console.log(message);
    };

    await getFormsService().addQuestion(
      token,
      formId,
      questionData,
      addLog
    );

    res.json({ 
      success: true,
      logs
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Create Express router
const router = Router();

// API endpoints
router.get('/user-info', validateToken, getUserInfo);
router.post('/forms', validateToken, createForm);
router.get('/forms/:formId/questions', validateToken, fetchQuestions);
router.put('/forms/:formId/questions/:questionId', validateToken, updateQuestion);
router.post('/forms/:formId/questions', validateToken, addQuestion);

export const googleFormApiRoutes = router; 