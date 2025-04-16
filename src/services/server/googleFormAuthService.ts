import { CredentialResponse } from '@react-oauth/google';

export interface UserInfo {
  name?: string;
  given_name?: string;
  picture?: string;
  email?: string;
  [key: string]: any;
}

export interface TokenInfo {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface GoogleAuthConfig {
  clientId: string;
  scope: string;
  flow: 'implicit';
}

export class GoogleAuthService {
  private config: GoogleAuthConfig;

  constructor(config: GoogleAuthConfig) {
    this.config = config;
  }

  /**
   * Decode a JWT token to get user information
   */
  public decodeToken(token: string): UserInfo | null {
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        return JSON.parse(atob(tokenParts[1]));
      }
      return null;
    } catch (err) {
      console.error('Error decoding token:', err);
      return null;
    }
  }

  /**
   * Fetch user information from Google's userinfo endpoint
   */
  public async fetchUserInfo(token: string): Promise<UserInfo | null> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.status}`);
      }

      const data = await response.json();
      return data as UserInfo;
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  }

  /**
   * Handle successful login and get user information
   */
  public async handleLoginSuccess(
    credentialResponse: CredentialResponse,
    onSuccess: (token: string, userInfo: UserInfo) => void,
    onError: (error: string) => void
  ): Promise<void> {
    const token = credentialResponse.credential;
    if (!token) {
      onError('No token received in credential response');
      return;
    }

    const decodedToken = this.decodeToken(token);
    if (!decodedToken) {
      onError('Failed to decode token');
      return;
    }

    const userInfo = await this.fetchUserInfo(token);
    if (!userInfo) {
      onError('Failed to fetch user info');
      return;
    }

    onSuccess(token, userInfo);
  }

  /**
   * Handle login error and provide appropriate error message
   */
  public handleLoginError(error: any): { message: string; showTestingHelp: boolean } {
    const isAccessDenied = error.error === 'access_denied' || 
      (error.error_description && error.error_description.includes('access_denied'));

    return {
      message: isAccessDenied 
        ? 'Google OAuth access denied. See testing instructions below.'
        : `Failed to get access token: ${error.error || 'Unknown error'}`,
      showTestingHelp: isAccessDenied
    };
  }

  /**
   * Get the OAuth configuration for the Google Login component
   */
  public getOAuthConfig() {
    return {
      clientId: this.config.clientId,
      scope: this.config.scope,
      flow: this.config.flow
    };
  }
} 