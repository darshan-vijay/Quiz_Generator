import { UserInfo } from './googleFormAuthServiceModels';
import { QuizData, QuizQuestion, ExistingQuestion, FormCreationResponse } from './googleFormServiceModels';

// Use environment variable for API base URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export class ApiClient {
  /**
   * Test API connectivity
   */
  static async testConnection(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/test`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return response.json();
  }

  /**
   * Get user information
   */
  static async getUserInfo(accessToken: string): Promise<UserInfo> {
    const response = await fetch(`${API_BASE_URL}/user-info`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Failed to fetch user info');
    }

    return response.json() as Promise<UserInfo>;
  }

  /**
   * Create a form with the selected questions
   */
  static async createForm(
    accessToken: string,
    quizData: QuizData,
    selectedQuestions: Set<number>,
    onLog?: (message: string) => void
  ): Promise<FormCreationResponse & { logs: string[] }> {
    const response = await fetch(`${API_BASE_URL}/forms`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        quizData,
        selectedQuestions: Array.from(selectedQuestions)
      })
    });

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Failed to create form');
    }

    const result = await response.json() as FormCreationResponse & { logs: string[] };
    
    // Process logs if onLog callback is provided
    if (onLog && result.logs) {
      result.logs.forEach((log: string) => onLog(log));
    }

    return result;
  }

  /**
   * Fetch questions from an existing form
   */
  static async fetchQuestions(accessToken: string, formId: string): Promise<ExistingQuestion[]> {
    const response = await fetch(`${API_BASE_URL}/forms/${formId}/questions`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Failed to fetch questions');
    }

    return response.json() as Promise<ExistingQuestion[]>;
  }

  /**
   * Update an existing question
   */
  static async updateQuestion(
    accessToken: string,
    formId: string,
    questionId: string,
    questionData: QuizQuestion,
    index: number
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/forms/${formId}/questions/${questionId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        questionData,
        index
      })
    });

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Failed to update question');
    }
  }

  /**
   * Add a new question to a form
   */
  static async addQuestion(
    accessToken: string,
    formId: string,
    questionData: QuizQuestion,
    onLog?: (message: string) => void
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/forms/${formId}/questions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        questionData
      })
    });

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Failed to add question');
    }

    const result = await response.json() as { logs?: string[] };
    
    // Process logs if onLog callback is provided
    if (onLog && result.logs) {
      result.logs.forEach((log: string) => onLog(log));
    }
  }
} 