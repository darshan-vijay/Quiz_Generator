import express, { Router, Request, Response, NextFunction } from 'express';
import { GoogleAuthService } from './googleFormAuthService';
import { GoogleFormsService, QuizData } from './googleFormService';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Express router
const router = Router();

// Initialize services
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

let authService = getAuthService();

function getAuthService(): GoogleAuthService {
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


const formsService = new GoogleFormsService();

// Middleware to validate token
const validateToken = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'No authorization token provided' });
    return;
  }
  // Attach token to request for use in route handlers
  (req as any).token = token;
  next();
};

// API endpoints

// Get user info
router.get('/user-info', validateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const token = (req as any).token;
    const userInfo = await authService.fetchUserInfo(token);
    if (!userInfo) {
      res.status(401).json({ error: 'Failed to fetch user information' });
      return;
    }
    res.json(userInfo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a form
router.post('/forms', validateToken, async (req: Request, res: Response): Promise<void> => {
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

    const result = await formsService.createForm(
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
});

// Fetch existing questions
router.get('/forms/:formId/questions', validateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const token = (req as any).token;
    const { formId } = req.params;

    if (!formId) {
      res.status(400).json({ error: 'Missing form ID' });
      return;
    }

    const questions = await formsService.fetchQuestions(token, formId);
    res.json(questions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a question
router.put('/forms/:formId/questions/:questionId', validateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const token = (req as any).token;
    const { formId, questionId } = req.params;
    const { questionData, index } = req.body;

    if (!formId || !questionId || !questionData || index === undefined) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }

    await formsService.updateQuestion(
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
});

// Add a new question
router.post('/forms/:formId/questions', validateToken, async (req: Request, res: Response): Promise<void> => {
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

    await formsService.addQuestion(
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
});

export const googleFormApiRoutes = router; 