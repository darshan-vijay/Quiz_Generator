import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createQuizRouter } from './route';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors({
    origin: '*',
    methods: '*',
    allowedHeaders: '*',
}));

// Add JSON body parser middleware
app.use(express.json());

const apiKey = process.env.API_KEY;

app.use('/api/quiz', createQuizRouter(apiKey));

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

export default app;