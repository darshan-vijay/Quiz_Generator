import express, { Router } from 'express';
import { QuizController } from './quizController';

export const createQuizRouter = () : Router => {

    const router = express.Router();

    const quizController = new QuizController();

    router.post('/generate-quiz', quizController.generateQuiz);
    
    return router;
}