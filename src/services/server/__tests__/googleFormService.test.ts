import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleFormsService, QuizData, QuizQuestion } from '../googleFormService';

describe('GoogleFormsService', () => {
  let service: GoogleFormsService;
  let mockFetch: any;
  let mockOnLog: (message: string) => void;

  beforeEach(() => {
    // Reset mocks before each test
    mockOnLog = vi.fn();
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    service = new GoogleFormsService();
  });

  describe('createForm', () => {
    const mockQuizData: QuizData = {
      quizTitle: 'Test Quiz',
      description: 'Test Description',
      questions: [
        {
          title: 'Test Question',
          type: 'multiple_choice',
          required: true,
          points: 1,
          options: ['Option 1', 'Option 2'],
          correctAnswer: 'Option 1'
        }
      ]
    };

    it('should successfully create a form', async () => {
      // Mock successful form creation
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          text: () => Promise.resolve(JSON.stringify({ formId: 'test-form-id' }))
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          text: () => Promise.resolve('{"success": true}')
        });

      const result = await service.createForm('test-token', mockQuizData, new Set([0]), mockOnLog);

      expect(result).toEqual({
        formId: 'test-form-id',
        formUrl: 'https://docs.google.com/forms/d/test-form-id/edit'
      });
      expect(mockOnLog).toHaveBeenCalled();
    });

    it('should throw error when form creation fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: () => Promise.resolve('Error creating form')
      });

      await expect(
        service.createForm('test-token', mockQuizData, new Set([0]), mockOnLog)
      ).rejects.toThrow('Failed to create form');
    });
  });

  describe('fetchQuestions', () => {
    const mockFormResponse = {
      items: [
        {
          questionItem: {
            question: {
              questionId: 'q1',
              required: true,
              grading: {
                pointValue: 1,
                correctAnswers: {
                  answers: [{ value: 'correct' }]
                }
              },
              choiceQuestion: {
                type: 'RADIO',
                options: [{ value: 'opt1' }, { value: 'opt2' }]
              }
            }
          },
          title: 'Test Question'
        }
      ]
    };

    it('should successfully fetch questions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFormResponse)
      });

      const questions = await service.fetchQuestions('test-token', 'test-form-id');

      expect(questions).toHaveLength(1);
      expect(questions[0]).toMatchObject({
        id: 'q1',
        title: 'Test Question',
        type: 'multiple_choice',
        required: true
      });
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await expect(
        service.fetchQuestions('test-token', 'test-form-id')
      ).rejects.toThrow('Failed to fetch form');
    });
  });

  describe('updateQuestion', () => {
    const mockQuestionData: QuizQuestion = {
      title: 'Updated Question',
      type: 'multiple_choice',
      required: true,
      points: 2,
      options: ['Option 1', 'Option 2'],
      correctAnswer: 'Option 1'
    };

    it('should successfully update a question', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      await expect(
        service.updateQuestion('test-token', 'form-id', 'question-id', mockQuestionData, 0)
      ).resolves.not.toThrow();
    });

    it('should throw error when update fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Update failed')
      });

      await expect(
        service.updateQuestion('test-token', 'form-id', 'question-id', mockQuestionData, 0)
      ).rejects.toThrow();
    });
  });

  describe('addQuestion', () => {
    const mockQuestion: QuizQuestion = {
      title: 'New Question',
      type: 'short_answer',
      required: true,
      points: 1,
      correctAnswer: 'Answer'
    };

    it('should successfully add a new question', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('{"success": true}')
      });

      await expect(
        service.addQuestion('test-token', 'form-id', mockQuestion, mockOnLog)
      ).resolves.not.toThrow();
      expect(mockOnLog).toHaveBeenCalled();
    });
  });
}); 