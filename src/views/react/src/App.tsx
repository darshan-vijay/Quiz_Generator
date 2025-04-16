import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse, useGoogleLogin } from '@react-oauth/google';
import './App.css';
import quizData from './quizData.json';
import { UserInfo } from './services/googleFormAuthService';
import { QuizData } from './services/googleFormService';
import { ApiClient } from './services/api';
// import FormModifier from './components/FormModifier';
// import './components/FormModifier.css';

// Replace with your actual Google OAuth client ID
const GOOGLE_CLIENT_ID = '456285933079-lv2hpg5abndoltccheqeom2l1qqftek0.apps.googleusercontent.com';

// Login component that uses the useGoogleLogin hook
interface LoginProps {
  onLoginSuccess: (token: string) => void;
  onUserInfo: (info: UserInfo) => void;
  onError: (error: string) => void;
  addLog: (message: string) => void;
}

function LoginButton({ onLoginSuccess, onUserInfo, onError, addLog }: LoginProps) {
  const [showTestingHelp, setShowTestingHelp] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      addLog('Access token login success');
      console.log('Token response:', tokenResponse);
      
      const token = tokenResponse.access_token;
      addLog(`Received access token: ${token.substring(0, 10)}...`);
      onLoginSuccess(token);
      
      try {
        // Get user info using API client
        const userInfo = await ApiClient.getUserInfo(token);
        if (userInfo) {
          onUserInfo(userInfo);
        }
      } catch (error) {
        addLog(`Error fetching user info: ${error}`);
        onError(`Failed to fetch user info: ${error}`);
      }
    },
    onError: (error: any) => {
      addLog(`Access token login error: ${JSON.stringify(error)}`);
      
      // Simple error handling
      const isAccessDenied = error.error === 'access_denied' || 
        (error.error_description && error.error_description.includes('access_denied'));
      
      setShowTestingHelp(isAccessDenied);
      onError(isAccessDenied 
        ? 'Google OAuth access denied. See testing instructions below.'
        : `Failed to get access token: ${error.error || 'Unknown error'}`);
    },
    scope: 'https://www.googleapis.com/auth/forms.body',
    flow: 'implicit'
  });

  return (
    <div className="login-buttons">
      <button onClick={() => login()} className="google-login-button">
        Sign in with Google (Access Token)
      </button>
      <div className="login-note">
        <p>This button requests an access token with Forms API scope</p>
      </div>

      {showTestingHelp && (
        <div className="testing-help">
          <h3>Testing Mode Instructions</h3>
          <p>Your app is in testing mode and hasn't been verified by Google yet. To fix this:</p>
          <ol>
            <li>Go to the <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" rel="noopener noreferrer">Google Cloud Console OAuth consent screen</a></li>
            <li>Add your email address as a test user</li>
            <li>Make sure your app is set to "External" with "Testing" status</li>
            <li>Verify that <code>http://localhost:3000</code> is in the authorized JavaScript origins</li>
            <li>Try signing in again with the same Google account you added as a test user</li>
          </ol>
        </div>
      )}
    </div>
  );
}

function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [createdFormUrl, setCreatedFormUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [formId, setFormId] = useState<string | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
  const [createdFormId, setCreatedFormId] = useState<string | null>(null);
  const [apiTestResult, setApiTestResult] = useState<string | null>(null);

  // Function to add logs
  const addLog = (message: string) => {
    console.log(message);
    setLogs(prevLogs => [...prevLogs, `${new Date().toISOString()}: ${message}`]);
  };

  // Initialize all questions as selected
  useEffect(() => {
    setSelectedQuestions(new Set(quizData.questions.map((_, index) => index)));
    addLog('App initialized');
  }, []);

  // Function to toggle question selection
  const toggleQuestion = (index: number) => {
    setSelectedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Function to select/deselect all questions
  const toggleAllQuestions = () => {
    if (selectedQuestions.size === quizData.questions.length) {
      setSelectedQuestions(new Set());
    } else {
      setSelectedQuestions(new Set(quizData.questions.map((_, index) => index)));
    }
  };

  const handleAccessTokenSuccess = (token: string) => {
    setAccessToken(token);
  };

  const handleUserInfo = (info: UserInfo) => {
    setUserInfo(info);
  };

  const handleLoginError = (errorMsg: string) => {
    addLog(`Login error: ${errorMsg}`);
    setError(errorMsg);
  };

  const handleCreateQuiz = async () => {
    if (!accessToken) {
      const errorMsg = 'Please sign in with Google first';
      addLog(errorMsg);
      setError(errorMsg);
      return;
    }

    addLog('Starting form creation process');
    setIsCreating(true);
    setError(null);
    
    try {
      // Create form using the API client
      const result = await ApiClient.createForm(
        accessToken,
        quizData as QuizData,
        selectedQuestions,
        addLog
      );
      
      setFormId(result.formId);
      setCreatedFormId(result.formId);
      setCreatedFormUrl(result.formUrl);
      addLog(`Form created successfully. URL: ${result.formUrl}`);
      
    } catch (err: any) {
      const errorMsg = `Failed to complete form creation: ${err.message}`;
      addLog(`Error: ${errorMsg}`);
      console.error('Error creating form:', err);
      setError(errorMsg);
    } finally {
      setIsCreating(false);
    }
  };

  const testApiConnection = async () => {
    try {
      addLog('Testing API connection to port 3001...');
      
      // Use the ApiClient to test the connection
      const data = await ApiClient.testConnection();
      
      addLog(`API Test Result: ${JSON.stringify(data)}`);
      setApiTestResult(`Connected successfully! Server message: ${data.message}`);
    } catch (error) {
      const errorMsg = `API connection test failed: ${error}`;
      addLog(errorMsg);
      setApiTestResult(errorMsg);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Google Form Creator</h1>
        <p>Create forms using Google Forms API</p>
      </header>
      
      <main className="App-main">
        <div className="api-test-section">
          <h2>API Connection Test</h2>
          <button 
            onClick={testApiConnection}
            className="test-api-button"
          >
            Test API Connection (Port 3001)
          </button>
          {apiTestResult && (
            <div className={apiTestResult.includes('failed') ? 'error-message' : 'success-message'}>
              {apiTestResult}
            </div>
          )}
        </div>
        
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <div className="auth-section">
            <h2>Step 1: Sign in with Google</h2>
            {!accessToken ? (
              <LoginButton 
                onLoginSuccess={handleAccessTokenSuccess}
                onUserInfo={handleUserInfo}
                onError={handleLoginError}
                addLog={addLog}
              />
            ) : (
              <div className="success-message">
                <p>✓ Signed in successfully</p>
                {userInfo && (
                  <div className="user-info">
                    <p>Welcome, {userInfo.name || userInfo.given_name}</p>
                    {userInfo.picture && (
                      <img 
                        src={userInfo.picture} 
                        alt="Profile" 
                        className="profile-image" 
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="quiz-section">
            <h2>Step 2: Select Questions</h2>
            <div className="quiz-info">
              <h3>Form Information</h3>
              <p><strong>Title:</strong> {quizData.quizTitle}</p>
              <p><strong>Description:</strong> {quizData.description}</p>
              <p><strong>Selected Questions:</strong> {selectedQuestions.size} of {quizData.questions.length}</p>
            </div>

            <div className="questions-selection">
              <div className="selection-header">
                <button 
                  onClick={toggleAllQuestions}
                  className="select-all-button"
                >
                  {selectedQuestions.size === quizData.questions.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="questions-list">
                {quizData.questions.map((question, index) => (
                  <div 
                    key={index} 
                    className={`question-item ${selectedQuestions.has(index) ? 'selected' : ''}`}
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
                      <span className="question-points">{question.points} points</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="creation-options">
              <button 
                onClick={handleCreateQuiz}
                disabled={isCreating || !accessToken}
                className="create-quiz-button"
              >
                {isCreating ? 'Creating Form...' : 'Create Form with API'}
              </button>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {createdFormUrl && (
              <div className="success-message">
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
          </div>

          {/* <div className="form-modifier-section">
            <h2>Step 3: Modify Form</h2>
            <FormModifier
              accessToken={accessToken}
              formId={createdFormId}
              onLog={addLog}
            />
          </div> */}

          <div className="logs-section">
            <h2>Debug Logs</h2>
            <button 
              onClick={() => setLogs([])}
              className="clear-logs-button"
            >
              Clear Logs
            </button>
            <div className="logs-container">
              {logs.map((log, index) => (
                <div key={index} className="log-entry">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </GoogleOAuthProvider>
      </main>
      
      <footer className="App-footer">
        <p>This is a simple app to test the Google Forms API.</p>
        <p>Note: You need to configure your Google Cloud project to enable the Forms API and set up OAuth consent with the appropriate scopes.</p>
      </footer>
    </div>
  );
}

export default App; 