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
}
