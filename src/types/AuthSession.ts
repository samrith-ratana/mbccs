export interface AuthSession {
  sessionId: string;
  userId: string;
  refreshToken: string;
  createdAt: string;
  expiresAt: string;
}

export interface AuthSessionCreateInput {
  userId: string;
  refreshToken: string;
  expiresAt: string;
}

export interface AuthSessionUpdateInput {
  refreshToken?: string;
  expiresAt?: string;
}
