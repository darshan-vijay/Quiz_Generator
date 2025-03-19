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

interface GoogleFormResponse {
  items: Array<{
    questionItem: {
      question: {
        questionId: string;
        required: boolean;
        grading?: {
          pointValue: number;
          correctAnswers?: {
            answers: Array<{ value: string }>;
          };
        };
        choiceQuestion?: {
          type: string;
          options: Array<{ value: string }>;
        };
        textQuestion?: {
          paragraph: boolean;
        };
      };
    };
    title: string;
  }>;
}

/**
 * Create a new Google Form with the provided quiz data
 */

export class GoogleFormsService {
  private readonly formsApiUrl = "https://forms.googleapis.com/v1/forms";

  public async createForm(
    token: string,
    quizData: QuizData,
    selectedQuestions: Set<number>,
    onLog: (message: string) => void
  ): Promise<FormCreationResponse> {
    onLog("Creating form with title...");

    try {
      // Step 1: Create form with only the title
      const formId = await this.createFormWithTitle(
        token,
        quizData.quizTitle,
        onLog
      );

      // Step 2: Update form with description, settings, and selected questions
      await this.updateFormWithContent(
        token,
        formId,
        quizData,
        selectedQuestions,
        onLog
      );

      return {
        formId,
        formUrl: `https://docs.google.com/forms/d/${formId}/edit`,
      };
    } catch (error: any) {
      throw new Error(`Failed to create form: ${error.message}`);
    }
  }

  /**
   * Create a new form with just the title
   */
  private async createFormWithTitle(
    token: string,
    title: string,
    onLog: (message: string) => void
  ): Promise<string> {
    const createResponse = await fetch(this.formsApiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        info: {
          title: title,
        },
      }),
    });

    const createResponseText = await createResponse.text();
    onLog(
      `Form creation response status: ${createResponse.status} ${createResponse.statusText}`
    );
    onLog(`Form creation response body: ${createResponseText}`);

    if (!createResponse.ok) {
      throw new Error(
        `Failed to create form: ${createResponse.status} - ${createResponseText}`
      );
    }

    const createData = JSON.parse(createResponseText);
    if (!createData.formId) {
      throw new Error("No form ID returned");
    }

    onLog(`Form created with ID: ${createData.formId}`);
    return createData.formId;
  }

  /**
   * Update the form with description, settings, and questions
   */
  private async updateFormWithContent(
    token: string,
    formId: string,
    quizData: QuizData,
    selectedQuestions: Set<number>,
    onLog: (message: string) => void
  ): Promise<void> {
    const batchUpdateUrl = `${this.formsApiUrl}/${formId}:batchUpdate`;
    onLog(`Batch update URL: ${batchUpdateUrl}`);

    const questionRequests = this.createQuestionRequests(
      quizData,
      selectedQuestions
    );
    const requests = [
      {
        updateFormInfo: {
          info: {
            description: quizData.description,
          },
          updateMask: "description",
        },
      },
      {
        updateSettings: {
          settings: {
            quizSettings: {
              isQuiz: true,
            },
          },
          updateMask: "quizSettings.isQuiz",
        },
      },
      ...questionRequests,
    ];

    const batchUpdateResponse = await fetch(batchUpdateUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requests }),
    });

    const batchUpdateResponseText = await batchUpdateResponse.text();
    onLog(
      `Batch update response status: ${batchUpdateResponse.status} ${batchUpdateResponse.statusText}`
    );
    onLog(`Batch update response body: ${batchUpdateResponseText}`);

    if (!batchUpdateResponse.ok) {
      throw new Error(
        `Failed to update form: ${batchUpdateResponse.status} - ${batchUpdateResponseText}`
      );
    }
  }

  /**
   * Create question requests for the batch update
   */
  private createQuestionRequests(
    quizData: QuizData,
    selectedQuestions: Set<number>
  ) {
    return Array.from(selectedQuestions).map((_, newIndex) => {
      const question =
        quizData.questions[Array.from(selectedQuestions)[newIndex]];

      if (question.type === "multiple_choice") {
        return this.createMultipleChoiceQuestion(question, newIndex);
      } else if (question.type === "paragraph") {
        return this.createParagraphQuestion(question, newIndex);
      } else {
        return this.createShortAnswerQuestion(question, newIndex);
      }
    });
  }

  /**
   * Create a multiple choice question request
   */
  private createMultipleChoiceQuestion(question: QuizQuestion, index: number) {
    return {
      createItem: {
        location: {
          index: index,
        },
        item: {
          title: question.title,
          questionItem: {
            question: {
              required: question.required,
              grading: {
                pointValue: question.points,
                correctAnswers: {
                  answers: question.isMultiSelect
                    ? question.correctAnswers?.map((answer) => ({
                        value: answer,
                      }))
                    : [{ value: question.correctAnswer }],
                },
              },
              choiceQuestion: {
                type: question.isMultiSelect ? "CHECKBOX" : "RADIO",
                options: question.options?.map((option) => ({ value: option })),
              },
            },
          },
        },
      },
    };
  }

  /**
   * Create a paragraph question request
   */
  private createParagraphQuestion(question: QuizQuestion, index: number) {
    return {
      createItem: {
        location: {
          index: index,
        },
        item: {
          title: question.title,
          questionItem: {
            question: {
              required: question.required,
              grading: {
                pointValue: question.points,
              },
              textQuestion: {
                paragraph: true,
              },
            },
          },
        },
      },
    };
  }

  /**
   * Create a short answer question request
   */
  private createShortAnswerQuestion(question: QuizQuestion, index: number) {
    return {
      createItem: {
        location: {
          index: index,
        },
        item: {
          title: question.title,
          questionItem: {
            question: {
              required: question.required,
              grading: {
                pointValue: question.points,
                correctAnswers: {
                  answers: [{ value: question.correctAnswer }],
                },
              },
              textQuestion: {
                paragraph: false,
              },
            },
          },
        },
      },
    };
  }

  /**
   * Fetch existing questions from a form
   */
  public async fetchQuestions(token: string, formId: string): Promise<ExistingQuestion[]> {
    const response = await fetch(`${this.formsApiUrl}/${formId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch form: ${response.status}`);
    }

    const data = await response.json() as GoogleFormResponse;
    return data.items
      ?.filter((item: any) => item.questionItem)
      .map((item: any) => ({
        id: item.questionItem.question.questionId,
        title: item.title,
        type: this.getQuestionType(item.questionItem.question),
        required: item.questionItem.question.required,
        points: item.questionItem.question.grading?.pointValue || 0,
        options: item.questionItem.question.choiceQuestion?.options?.map((opt: any) => opt.value) || [],
        correctAnswer: item.questionItem.question.grading?.correctAnswers?.answers?.[0]?.value,
        correctAnswers: item.questionItem.question.grading?.correctAnswers?.answers?.map((ans: any) => ans.value) || [],
        isMultiSelect: item.questionItem.question.choiceQuestion?.type === 'CHECKBOX'
      })) || [];
  }

  private getQuestionType(question: any): 'multiple_choice' | 'paragraph' | 'short_answer' {
    if (question.choiceQuestion) return 'multiple_choice';
    if (question.textQuestion?.paragraph) return 'paragraph';
    return 'short_answer';
  }
  
  /**
   * Update an existing question in a form
   */
  public async updateQuestion(
    token: string,
    formId: string,
    questionId: string,
    questionData: QuizQuestion,
    index: number
  ): Promise<void> {
    // Prepare the question item based on type
    let questionItem: any = {
      required: questionData.required,
      grading: {
        pointValue: questionData.points
      }
    };

    // Add type-specific properties
    if (questionData.type === 'multiple_choice') {
      questionItem.choiceQuestion = {
        type: questionData.isMultiSelect ? 'CHECKBOX' : 'RADIO',
        options: questionData.options?.map(option => ({ value: option })) || []
      };
      if (questionData.options && questionData.options.length > 0) {
        questionItem.grading.correctAnswers = {
          answers: questionData.isMultiSelect
            ? questionData.correctAnswers?.map(answer => ({ value: answer }))
            : [{ value: questionData.correctAnswer }]
        };
      }
    } else {
      questionItem.textQuestion = {
        paragraph: questionData.type === 'paragraph'
      };
      // Only add correctAnswers for short answer questions
      if (questionData.type === 'short_answer' && questionData.correctAnswer) {
        questionItem.grading.correctAnswers = {
          answers: [{ value: questionData.correctAnswer }]
        };
      }
    }

    const response = await fetch(`${this.formsApiUrl}/${formId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [{
          updateItem: {
            item: {
              itemId: questionId,
              title: questionData.title,
              questionItem: {
                question: questionItem
              }
            },
            location: { index },
            updateMask: 'title,questionItem.question'
          }
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`${response.status} - ${errorData}`);
    }
  }

  /**
   * Add a new question to a form
   */
  public async addQuestion(
    token: string,
    formId: string,
    questionData: QuizQuestion,
    onLog: (message: string) => void
  ): Promise<void> {
    await this.updateFormWithContent(
      token,
      formId,
      { quizTitle: '', description: '', questions: [questionData] },
      new Set([0]),
      onLog
    );
  }
}
