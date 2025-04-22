import React, { useState } from 'react';
import { ApiClient } from '../services/api';
import './QuizGenerator.css';
import { QuizData } from '../services/googleFormServiceModels';

interface QuizGeneratorProps {
  accessToken: string | null;
  onQuizGenerated: () => void;
  onFormCreated?: (quizData: QuizData, selectedQuestions: Set<number>) => Promise<void>;
  isCreating?: boolean;
  createdFormUrl?: string | null;
}

const QuizGenerator: React.FC<QuizGeneratorProps> = ({ 
  accessToken,
  onQuizGenerated,
  onFormCreated,
  isCreating = false,
  createdFormUrl
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  // Form fields
  const [topic, setTopic] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [multipleChoice, setMultipleChoice] = useState<number | undefined>(undefined);
  const [multipleSelect, setMultipleSelect] = useState<number | undefined>(undefined);
  const [shortAnswer, setShortAnswer] = useState<number | undefined>(undefined);
  const [paragraph, setParagraph] = useState<number | undefined>(undefined);
  const [apiKey, setApiKey] = useState<string>('');
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    
    // Reset form when collapsing
    if (isExpanded) {
      resetForm();
    }
  };
  
  const resetForm = () => {
    setTopic('');
    setQuestionCount(5);
    setMultipleChoice(undefined);
    setMultipleSelect(undefined);
    setShortAnswer(undefined);
    setParagraph(undefined);
    // Keep the API key value since it's required
    setError(null);
    setSuccess(false);
  };
  
  const calculateRemainingCount = () => {
    const specified = (multipleChoice || 0) + (multipleSelect || 0) + (shortAnswer || 0) + (paragraph || 0);
    return questionCount - specified;
  };
  
  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      setError('Topic is required');
      return;
    }

    if (!apiKey.trim()) {
      setError('API Key is required');
      return;
    }
    
    // Validate that question counts don't exceed total
    const specified = (multipleChoice || 0) + (multipleSelect || 0) + (shortAnswer || 0) + (paragraph || 0);
    if (specified > questionCount) {
      setError(`Total question counts (${specified}) exceeds the total requested (${questionCount})`);
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const result = await ApiClient.generateQuiz(
        topic,
        questionCount,
        apiKey,
        multipleChoice,
        multipleSelect,
        shortAnswer,
        paragraph
      );
      
      if (result.success) {
        setSuccess(true);
        // Refresh the quiz list after successful generation
        onQuizGenerated();
        
        // Auto-collapse after 3 seconds
        setTimeout(() => {
          setIsExpanded(false);
          resetForm();
        }, 3000);
      } else {
        setError(result.error || 'Failed to generate quiz');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating the quiz');
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="quiz-generator-container">
      <div 
        className={`quiz-generator-header ${isExpanded ? 'expanded' : ''}`}
        onClick={toggleExpand}
      >
        <h2>Generate a New Quiz</h2>
        <div className="quiz-expand-icon">
          {isExpanded ? '▼' : '▶'}
        </div>
      </div>
      
      {isExpanded && (
        <div className="quiz-generator-content">
          <p className="generator-description">
            Generate a new quiz by specifying a topic and the number of questions. 
            Optionally, you can specify how many questions of each type you want.
          </p>
          
          {error && <div className="generator-error">{error}</div>}
          {success && <div className="generator-success">Quiz generated successfully!</div>}
          
          <form onSubmit={handleGenerateQuiz} className="generator-form">
            <div className="form-group">
              <label htmlFor="topic">Topic (required)</label>
              <input
                type="text"
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="E.g., JavaScript Fundamentals, World History, etc."
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="apiKey">API Key (required)</label>
              <input
                type="password"
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                required
              />
              <small className="api-key-hint">
                This API key is used for generating quiz content via the LLM service.
              </small>
            </div>
            
            <div className="form-group">
              <label htmlFor="questionCount">Total Number of Questions</label>
              <input
                type="number"
                id="questionCount"
                value={questionCount}
                onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max="20"
              />
            </div>
            
            <div className="question-types-container">
              <h3>Question Types (Optional)</h3>
              <p className="question-types-hint">
                Specify how many questions of each type you want. 
                {calculateRemainingCount() !== questionCount && (
                  <span className={calculateRemainingCount() < 0 ? 'error' : ''}>
                    {calculateRemainingCount() >= 0 
                      ? ` (${calculateRemainingCount()} unspecified question${calculateRemainingCount() !== 1 ? 's' : ''})`
                      : ` (Exceeded by ${Math.abs(calculateRemainingCount())} question${Math.abs(calculateRemainingCount()) !== 1 ? 's' : ''})`}
                  </span>
                )}
              </p>
              
              <div className="question-types-grid">
                <div className="form-group">
                  <label htmlFor="multipleChoice">Multiple Choice</label>
                  <input
                    type="number"
                    id="multipleChoice"
                    value={multipleChoice === undefined ? '' : multipleChoice}
                    onChange={(e) => setMultipleChoice(e.target.value === '' ? undefined : Math.max(0, parseInt(e.target.value) || 0))}
                    min="0"
                    max={questionCount}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="multipleSelect">Multiple Select</label>
                  <input
                    type="number"
                    id="multipleSelect"
                    value={multipleSelect === undefined ? '' : multipleSelect}
                    onChange={(e) => setMultipleSelect(e.target.value === '' ? undefined : Math.max(0, parseInt(e.target.value) || 0))}
                    min="0"
                    max={questionCount}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="shortAnswer">Short Answer</label>
                  <input
                    type="number"
                    id="shortAnswer"
                    value={shortAnswer === undefined ? '' : shortAnswer}
                    onChange={(e) => setShortAnswer(e.target.value === '' ? undefined : Math.max(0, parseInt(e.target.value) || 0))}
                    min="0"
                    max={questionCount}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="paragraph">Paragraph</label>
                  <input
                    type="number"
                    id="paragraph"
                    value={paragraph === undefined ? '' : paragraph}
                    onChange={(e) => setParagraph(e.target.value === '' ? undefined : Math.max(0, parseInt(e.target.value) || 0))}
                    min="0"
                    max={questionCount}
                  />
                </div>
              </div>
            </div>
            
            <div className="form-actions">
              <button
                type="submit"
                className="generate-button"
                disabled={isGenerating || !topic.trim() || !apiKey.trim() || calculateRemainingCount() < 0}
              >
                {isGenerating ? 'Generating...' : 'Generate Quiz'}
              </button>
              
              <button
                type="button"
                className="reset-button"
                onClick={resetForm}
                disabled={isGenerating}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default QuizGenerator; 