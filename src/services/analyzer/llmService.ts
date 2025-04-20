import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export interface QuizQuestion {
    type: 'multiple_choice' | 'paragraph' | 'short_answer';
    title: string;
    required: boolean;
    options?: string[];
    correctAnswer?: string;
    correctAnswers?: string[];
    isMultiSelect?: boolean;
    points?: number;
}

export interface GenerateQuiz {
    quizTitle: string;
    description: string;
    questions: QuizQuestion[];
}

export interface QuestionCounts {
    multipleChoice?: number;
    multipleSelect?: number;
    shortAnswer?: number;
    paragraph?: number;
}

export class LLMService {
    private apiKey: string;
    private baseUrl: string = 'https://api.openai.com/v1/chat/completions';

    constructor(apiKey?: string) {
        const key = apiKey || process.env.OPENAI_API_KEY;
        if (!key) {
            throw new Error('OPENAI_API_KEY is not set');
        }
        this.apiKey = key;
    }

    async generateQuiz(
        topic : string,
        questionCount: number = 5,
        counts?: QuestionCounts
    ): Promise<GenerateQuiz> {

        const prompt = this.buildPrompt(topic, questionCount, counts);

        const response = await axios.post(
            this.baseUrl, 
            {
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant that creates educational quizzes on various topics."
                    },
                    {
                    role: "user", 
                    content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 5000
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    
                }
            }
        );

        const content = response.data.choices[0].message.content;
        const quiz = this.parseQuizContent(content);

       return quiz;
    }

    private buildPrompt(
        topic: string, 
        questionCount: number, 
        counts?: QuestionCounts
    ): string {

        let quesTypeInstructions = '';
        if (counts && (counts.multipleChoice || counts.multipleSelect || counts.shortAnswer || counts.paragraph)) {

            quesTypeInstructions = '- - Questions should include the following counts:\n'

            if (counts.multipleChoice) {
                quesTypeInstructions += `  - ${counts.multipleChoice} Multiple choice questions (with 4-6 options and one correct answer)\n`;
            }
            if (counts.multipleSelect) {
                quesTypeInstructions += `  - ${counts.multipleSelect} Multiple select questions (with 4-6 options and 1-3 correct answers)\n`;
            }
            if (counts.shortAnswer) {
                quesTypeInstructions += `  - ${counts.shortAnswer} Short answer questions (with a single correct answer)\n`;
            }
            if (counts.paragraph) {
                quesTypeInstructions += `  - ${counts.paragraph} Paragraph questions (which require a written explanation)\n`;
            }
        }
        else {
            // Default instruction for evenly distributed question types
            quesTypeInstructions = `- ${questionCount} questions with the following types distributed evenly:
            - Multiple choice questions (with 4-6 options and one correct answer)
            - Multiple select questions (with 4-6 options and 2-3 correct answers)
            - Short answer questions (with a one-word or short phrase answer)
            - Paragraph questions (which require a written explanation)`;
        }

        return `Create an educational quiz about "${topic}" with ${questionCount} questions.
    
The quiz should include:
- A quiz title
- A brief description of the quiz
${quesTypeInstructions}

For each question, specify:
- The question title/text
- Question type
- Answer options (for multiple choice/select)
- Correct answer(s)
- Point value (1-3 based on difficulty)

Please format the response as a valid JSON object that matches this structure:
{
  "quizTitle": "Quiz Title",
  "description": "Quiz description",
  "questions": [
    {
      "type": "multiple_choice",
      "title": "Question text",
      "required": true,
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "Correct option",
      "points": 1
    },
    {
      "type": "multiple_choice",
      "title": "Multiple select question text",
      "required": true,
      "options": ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5", "Option 6"],
      "correctAnswers": ["Correct 1", "Correct 2", "Correct 3"],
      "isMultiSelect": true,
      "points": 2
    },
    {
      "type": "paragraph",
      "title": "Paragraph question text",
      "required": true,
      "points": 3
    },
    {
      "type": "short_answer",
      "title": "Short answer question",
      "required": true,
      "correctAnswer": "Answer",
      "points": 1
    }
  ]
}`;
    
}

    private parseQuizContent(content: string): GenerateQuiz {

        try{
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No valid JSON found in the response');
            }

            const jsonStr = jsonMatch[0];
            const quiz = JSON.parse(jsonStr) as GenerateQuiz;

            if (!quiz.quizTitle || !quiz.description || !Array.isArray(quiz.questions)){
                throw new Error('Generated quiz does not have the expected structure');
            }

            return quiz;
        }
        catch (error : any) {
            console.error('Error parsing quiz content:', error.message);
            throw new Error(`Failed to parse quiz content : ${error.message}`);
        }
    }
    
}

