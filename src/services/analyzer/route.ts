import express, { Router } from 'express';
import { QuizController } from './quizController';

export const createQuizRouter = (apiKey?: string) : Router => {

    const router = express.Router();

    const quizController = new QuizController(apiKey);

    router.post('/generate-quiz', quizController.generateQuiz);
    
    return router;
}