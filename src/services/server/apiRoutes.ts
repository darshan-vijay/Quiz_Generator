import express, { Router, Request, Response } from 'express';
import { GoogleAuthService } from './googleFormAuthService';
import { GoogleFormsService, QuizData } from './googleFormService';

// Create Express router
const router = Router();

// Initialize services
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 
  '456285933079-lv2hpg5abndoltccheqfom2l1qqftek0.apps.googleusercontent.com';

const authService = new GoogleAuthService({
  clientId: GOOGLE_CLIENT_ID,
  scope: 'https://www.googleapis.com/auth/forms.body',
  flow: 'implicit'
});

const formsService = new GoogleFormsService();

// Middleware to validate token
const validateToken = (req: Request, res: Response, next: () => void) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }
  // Attach token to request for use in route handlers
  (req as any).token = token;
  next();
};

// API endpoints

// Get user info
router.get('/user-info', validateToken, async (req: Request, res: Response) => {
  try {
    const token = (req as any).token;
    const userInfo = await authService.fetchUserInfo(token);
    if (!userInfo) {
      return res.status(401).json({ error: 'Failed to fetch user information' });
    }
    res.json(userInfo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a form
router.post('/forms', validateToken, async (req: Request, res: Response) => {
  try {
    const token = (req as any).token;
    const { quizData, selectedQuestions } = req.body;
    
    if (!quizData || !selectedQuestions) {
      return res.status(400).json({ error: 'Missing required quiz data or selected questions' });
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
router.get('/forms/:formId/questions', validateToken, async (req: Request, res: Response) => {
  try {
    const token = (req as any).token;
    const { formId } = req.params;

    if (!formId) {
      return res.status(400).json({ error: 'Missing form ID' });
    }

    const questions = await formsService.fetchQuestions(token, formId);
    res.json(questions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a question
router.put('/forms/:formId/questions/:questionId', validateToken, async (req: Request, res: Response) => {
  try {
    const token = (req as any).token;
    const { formId, questionId } = req.params;
    const { questionData, index } = req.body;

    if (!formId || !questionId || !questionData || index === undefined) {
      return res.status(400).json({ error: 'Missing required parameters' });
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
router.post('/forms/:formId/questions', validateToken, async (req: Request, res: Response) => {
  try {
    const token = (req as any).token;
    const { formId } = req.params;
    const { questionData } = req.body;

    if (!formId || !questionData) {
      return res.status(400).json({ error: 'Missing required parameters' });
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