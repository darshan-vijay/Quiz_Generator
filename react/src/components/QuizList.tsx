import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/api';
import './QuizList.css';

interface Quiz {
  id: string;
  title: string;
  description: string;
  topic: string;
  createdAt: string;
}

const QuizList: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);

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

  const handleQuizClick = (quizId: string) => {
    setSelectedQuiz(quizId);
    // You can navigate to a quiz detail page or show details in a modal
    window.location.href = `/quiz/${quizId}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return <div className="quiz-list-loading">Loading quizzes...</div>;
  }

  if (error) {
    return <div className="quiz-list-error">Error: {error}</div>;
  }

  if (quizzes.length === 0) {
    return <div className="quiz-list-empty">No quizzes found. Create your first quiz!</div>;
  }

  return (
    <div className="quiz-list-container">
      <h2>All Quizzes</h2>
      <div className="quiz-grid">
        {quizzes.map((quiz) => (
          <div 
            key={quiz.id} 
            className="quiz-card"
            onClick={() => handleQuizClick(quiz.id)}
          >
            <h3 className="quiz-title">{quiz.title}</h3>
            <div className="quiz-topic">{quiz.topic}</div>
            <p className="quiz-description">{quiz.description}</p>
            <div className="quiz-footer">
              <span className="quiz-date">Created: {formatDate(quiz.createdAt)}</span>
              <button className="quiz-view-btn">View</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuizList; 