import React, { useState } from "react";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import "./App.css";
import { UserInfo } from "./services/googleFormAuthServiceModels";
import { QuizData } from "./services/googleFormServiceModels";
import { ApiClient } from "./services/api";
import QuizSelectorList from "./components/QuizSelectorList";
import QuizGenerator from "./components/QuizGenerator";
// import FormModifier from './components/FormModifier';
// import './components/FormModifier.css';
// import { db } from "./database/drizzle";
// import { question } from "./database/schema";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
if (!GOOGLE_CLIENT_ID) {
  throw new Error("REACT_APP_GOOGLE_CLIENT_ID environment variable is not set");
}

// Login component that uses the useGoogleLogin hook
interface LoginProps {
  onLoginSuccess: (token: string) => void;
  onUserInfo: (info: UserInfo) => void;
  onError: (error: string) => void;
}

function LoginButton({ onLoginSuccess, onUserInfo, onError }: LoginProps) {
  const [showTestingHelp, setShowTestingHelp] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const token = tokenResponse.access_token;
      onLoginSuccess(token);

      try {
        const userInfo = await ApiClient.getUserInfo(token);
        if (userInfo) {
          onUserInfo(userInfo);
        }
      } catch (error) {
        onError(`Failed to fetch user info: ${error}`);
      }
    },
    onError: (error: any) => {
      const isAccessDenied =
        error.error === "access_denied" ||
        (error.error_description &&
          error.error_description.includes("access_denied"));

      setShowTestingHelp(isAccessDenied);
      onError(
        isAccessDenied
          ? "Google OAuth access denied. See testing instructions below."
          : `Failed to get access token: ${error.error || "Unknown error"}`
      );
    },
    scope: "https://www.googleapis.com/auth/forms.body",
    flow: "implicit",
  });

  return (
    <div className="login-buttons">
      <button onClick={() => login()} className="google-login-button">
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
            fill="#4285F4"
          />
          <path
            d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
            fill="#34A853"
          />
          <path
            d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9c0 1.45.348 2.825.957 4.04l3.007-2.328z"
            fill="#FBBC05"
          />
          <path
            d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.96L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
            fill="#EA4335"
          />
        </svg>
        Sign in with Google
      </button>
      <div className="login-note">
        <p>This button requests an access token with Forms API scope</p>
      </div>

      {showTestingHelp && (
        <div className="testing-help">
          <h3>Testing Mode Instructions</h3>
          <p>
            Your app is in testing mode and hasn't been verified by Google yet.
            To fix this:
          </p>
          <ol>
            <li>
              Go to the{" "}
              <a
                href="https://console.cloud.google.com/apis/credentials/consent"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Cloud Console OAuth consent screen
              </a>
            </li>
            <li>Add your email address as a test user</li>
            <li>
              Make sure your app is set to "External" with "Testing" status
            </li>
            <li>
              Verify that <code>http://localhost:3000</code> is in the
              authorized JavaScript origins
            </li>
            <li>
              Try signing in again with the same Google account you added as a
              test user
            </li>
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
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [createdFormId, setCreatedFormId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const handleAccessTokenSuccess = (token: string) => {
    setAccessToken(token);
  };

  const handleUserInfo = (info: UserInfo) => {
    setUserInfo(info);
  };

  const handleLoginError = (errorMsg: string) => {
    setError(errorMsg);
  };

  const handleDbResults = async () => {
    // const res = await db.select().from(question);
    // console.log(JSON.stringify(res, null, 2));
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Google Form Creator</h1>
        <p>Create forms using Google Forms API</p>

        {/* <button onClick={() => handleDbResults()}>get DB data</button> */}
      </header>

      <main className="App-main">
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID as string}>
          <div className="auth-section">
            <h2>Step 1: Sign in with Google</h2>
            {!accessToken ? (
              <LoginButton
                onLoginSuccess={handleAccessTokenSuccess}
                onUserInfo={handleUserInfo}
                onError={handleLoginError}
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

          {/* Interactive Quiz Selector Section */}
          <div className="quiz-list-section">
            <h2>Quiz Creation Center</h2>
            <p className="section-description">Generate new quizzes or use existing ones to create Google Forms.</p>
            <QuizGenerator 
              accessToken={accessToken}
              onQuizGenerated={() => {
                // Refresh the quiz list when a new quiz is generated
                setRefreshKey(prev => prev + 1);
              }}
              isCreating={isCreating}
            />
            <QuizSelectorList 
              key={refreshKey}
              accessToken={accessToken}
              onCreateForm={async (quizData, selectedQuestions) => {
                setIsCreating(true);
                try {
                  const result = await ApiClient.createForm(
                    accessToken as string,
                    quizData,
                    selectedQuestions
                  );
                  setCreatedFormId(result.formId);
                  setCreatedFormUrl(result.formUrl);
                } catch (err: any) {
                  setError(`Failed to complete form creation: ${err.message}`);
                } finally {
                  setIsCreating(false);
                }
              }}
              isCreating={isCreating}
              createdFormUrl={createdFormUrl}
            />
            {error && <div className="error-message">{error}</div>}
          </div>

          {/* <div className="form-modifier-section">
            <h2>Step 3: Modify Form</h2>
            <FormModifier
              accessToken={accessToken}
              formId={createdFormId}
              onLog={addLog}
            />
          </div> */}
        </GoogleOAuthProvider>
      </main>

      <footer className="App-footer">
        <p>This is a simple app to test the Google Forms API.</p>
        <p>
          Note: You need to configure your Google Cloud project to enable the
          Forms API and set up OAuth consent with the appropriate scopes.
        </p>
      </footer>
    </div>
  );
}

export default App;
