import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/api';
import './QuizSelectorList.css';
import { QuizData, QuizQuestion } from '../services/googleFormServiceModels';

interface Quiz {
  id: string;
  title: string;
  description: string;
  topic: string;
  createdAt: string;
}

interface QuizWithQuestions extends QuizData {
  id: string;
  topic: string;
  createdAt: string;
}

interface QuizSelectorListProps {
  accessToken: string | null;
  onCreateForm: (quizData: QuizData, selectedQuestions: Set<number>) => Promise<void>;
  isCreating: boolean;
  createdFormUrl: string | null;
}

const QuizSelectorList: React.FC<QuizSelectorListProps> = ({ 
  accessToken, 
  onCreateForm,
  isCreating,
  createdFormUrl
}) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizWithQuestions | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingQuiz, setLoadingQuiz] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        const response = await ApiClient.getAllQuizzes();
        
        if (response.success) {
          setQuizzes(response.quizzes);
        } else {
          setError('Failed to fetch quizzes');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch quizzes');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  const handleQuizExpand = async (quizId: string) => {
    if (expandedQuizId === quizId) {
      // Collapse this quiz
      setExpandedQuizId(null);
      setSelectedQuiz(null);
      setSelectedQuestions(new Set());
      return;
    }

    try {
      setLoadingQuiz(true);
      setExpandedQuizId(quizId);
      
      const response = await ApiClient.getQuizById(quizId);
      
      if (response.success && response.quiz) {
        const quizWithId = {
          ...response.quiz,
          id: quizId,
          topic: quizzes.find(q => q.id === quizId)?.topic || '',
          createdAt: quizzes.find(q => q.id === quizId)?.createdAt || '',
        };
        
        setSelectedQuiz(quizWithId);
        // Initialize all questions as selected
        setSelectedQuestions(new Set(quizWithId.questions.map((_: QuizQuestion, index: number) => index)));
      } else {
        setError('Failed to fetch quiz details');
        setExpandedQuizId(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch quiz details');
      setExpandedQuizId(null);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const toggleQuestion = (index: number) => {
    setSelectedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const toggleAllQuestions = () => {
    if (!selectedQuiz) return;
    
    if (selectedQuestions.size === selectedQuiz.questions.length) {
      setSelectedQuestions(new Set());
    } else {
      setSelectedQuestions(
        new Set(selectedQuiz.questions.map((_, index) => index))
      );
    }
  };

  const handleCreateForm = () => {
    if (!selectedQuiz) return;
    
    const quizData: QuizData = {
      quizTitle: selectedQuiz.quizTitle,
      description: selectedQuiz.description,
      questions: selectedQuiz.questions
    };
    
    onCreateForm(quizData, selectedQuestions);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return <div className="quiz-selector-loading">Loading quizzes...</div>;
  }

  if (error) {
    return <div className="quiz-selector-error">Error: {error}</div>;
  }

  if (quizzes.length === 0) {
    return <div className="quiz-selector-empty">No quizzes found in the database.</div>;
  }

  return (
    <div className="quiz-selector-container">
      <h3 className="quiz-selector-title">Select from Existing Quizzes</h3>
      <div className="quiz-list">
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="quiz-item">
            <div 
              className={`quiz-header ${expandedQuizId === quiz.id ? 'expanded' : ''}`}
              onClick={() => handleQuizExpand(quiz.id)}
            >
              <h3>{quiz.title}</h3>
              <div className="quiz-info-brief">
                <span className="quiz-topic">{quiz.topic}</span>
                <span className="quiz-date">Created: {formatDate(quiz.createdAt)}</span>
              </div>
              <div className="quiz-expand-icon">
                {expandedQuizId === quiz.id ? '▼' : '▶'}
              </div>
            </div>
            
            {expandedQuizId === quiz.id && (
              <div className="quiz-details">
                {loadingQuiz ? (
                  <div className="quiz-details-loading">Loading quiz details...</div>
                ) : selectedQuiz ? (
                  <>
                    <div className="quiz-info-full">
                      <p className="quiz-description">{selectedQuiz.description}</p>
                      <p className="quiz-questions-count">
                        <strong>Selected Questions:</strong> {selectedQuestions.size} of {selectedQuiz.questions.length}
                      </p>
                    </div>
                    
                    <div className="questions-selection">
                      <div className="selection-header">
                        <button
                          onClick={toggleAllQuestions}
                          className="select-all-button"
                        >
                          {selectedQuestions.size === selectedQuiz.questions.length ? "Deselect All" : "Select All"}
                        </button>
                      </div>
                      
                      <div className="questions-list">
                        {selectedQuiz.questions.map((question: QuizQuestion, index: number) => (
                          <div
                            key={index}
                            className={`question-item ${
                              selectedQuestions.has(index) ? "selected" : ""
                            }`}
                          >
                            <label className="question-checkbox">
                              <input
                                type="checkbox"
                                checked={selectedQuestions.has(index)}
                                onChange={() => toggleQuestion(index)}
                              />
                              <span className="question-title">{question.title}</span>
                            </label>
                            <div className="question-details">
                              <span className="question-type">{question.type}</span>
                              <span className="question-points">
                                {question.points} points
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="creation-options">
                      <button
                        onClick={handleCreateForm}
                        disabled={isCreating || !accessToken || selectedQuestions.size === 0}
                        className="create-quiz-button"
                      >
                        {isCreating ? "Creating Form..." : "Create Google Form"}
                      </button>
                    </div>
                    
                    {createdFormUrl && (
                      <div className="success-message quiz-success-message">
                        <p>Form created successfully!</p>
                        <a
                          href={createdFormUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="form-link"
                        >
                          Open your form
                        </a>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="quiz-details-error">Failed to load quiz details.</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuizSelectorList; 