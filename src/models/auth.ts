import type { SafeUser, UserRecord } from "@/models/user";

export interface SessionRecord {
  sessionId: string;
  userId: string;
  refreshToken: string;
  createdAt: string;
  expiresAt: string;
}

export interface AuthStoreData {
  users: UserRecord[];
  sessions: SessionRecord[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: SafeUser;
  tokens: AuthTokens;
}

export interface LoginRequest {
  email: string;
  password: string;
}