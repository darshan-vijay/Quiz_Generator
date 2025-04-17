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