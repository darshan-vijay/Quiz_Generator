export interface QuizQuestion {
    title: string;
    type: "multiple_choice" | "paragraph" | "short_answer";
    required: boolean;
    points: number;
    options?: string[];
    correctAnswer?: string;
    correctAnswers?: string[];
    isMultiSelect?: boolean;
  }
  
  export interface QuizData {
    quizTitle: string;
    description: string;
    questions: QuizQuestion[];
  }
  
  export interface FormCreationResponse {
    formId: string;
    formUrl: string;
  }
  
  export interface ExistingQuestion {
      id: string;
      title: string;
      type: 'multiple_choice' | 'paragraph' | 'short_answer';
      required: boolean;
      points: number;
      options?: string[];
      correctAnswer?: string;
      correctAnswers?: string[];
      isMultiSelect?: boolean;
    }

  export interface CollectorEntry {
    id: string;
    title: string;
    category: string;
    content: string;
  }