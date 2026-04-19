import type { AuthResult, AuthStoreData, AuthTokens, SessionRecord } from "@/models/auth";
import type { UserRecord, UserRole } from "@/models/user";
import type { StoreAdapter } from "@/lib/storage";
import { OracleAuthStore } from "@/lib/storage/oracleAuthStore";
import { createId } from "@/lib/ids";
import { SecureAuth, secureAuth } from "@/lib/auth";
import { DataService } from "@/services/DataService";
import { UserService } from "@/services/UserService";
import { ServiceError } from "@/services/errors";

function resolveNumber(value: string | undefined, fallback: number) {
  const parsed = value ? Number(value) : fallback;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function createAuthStore(): StoreAdapter<AuthStoreData> {
  return new OracleAuthStore();
}

type AuthServiceConfig = {
  maxSessionsPerUser: number;
  sessionTtlMs: number;
};

function resolveAuthConfig(auth: SecureAuth): AuthServiceConfig {
  const defaultTtlMs = auth.refreshTokenTtlSeconds * 1000;
  return {
    maxSessionsPerUser: resolveNumber(process.env.AUTH_MAX_SESSIONS, 5),
    sessionTtlMs: resolveNumber(process.env.AUTH_SESSION_TTL_MS, defaultTtlMs),
  };
}

export class AuthService {
  private data: DataService;
  private users: UserService;
  private auth: SecureAuth;
  private config: AuthServiceConfig;

  constructor(data: DataService, users: UserService, auth: SecureAuth, config: AuthServiceConfig) {
    this.data = data;
    this.users = users;
    this.auth = auth;
    this.config = config;
  }

  private pruneExpiredSessions(sessions: SessionRecord[]) {
    const now = Date.now();
    return sessions.filter((session) => new Date(session.expiresAt).getTime() > now);
  }

  private enforceSessionLimit(sessions: SessionRecord[], userId: string) {
    const userSessions = sessions
      .filter((session) => session.userId === userId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

    if (userSessions.length <= this.config.maxSessionsPerUser) {
      return sessions;
    }

    const toRemove = new Set(
      userSessions
        .slice(0, userSessions.length - this.config.maxSessionsPerUser)
        .map((session) => session.sessionId)
    );

    return sessions.filter((session) => !toRemove.has(session.sessionId));
  }

  private async getActiveSessions() {
    const next = await this.data.update((store) => ({
      ...store,
      sessions: this.pruneExpiredSessions(store.sessions),
    }));

    return next.sessions;
  }

  private async createSession(userId: string, refreshToken: string) {
    const now = new Date().toISOString();
    const session: SessionRecord = {
      sessionId: createId("ses"),
      userId,
      refreshToken,
      createdAt: now,
      expiresAt: new Date(Date.now() + this.config.sessionTtlMs).toISOString(),
    };

    await this.data.update((store) => {
      const active = this.pruneExpiredSessions(store.sessions);
      const next = this.enforceSessionLimit([...active, session], userId);
      return { ...store, sessions: next };
    });

    return session;
  }

  private async deleteSession(sessionId: string) {
    await this.data.update((store) => ({
      ...store,
      sessions: this.pruneExpiredSessions(store.sessions).filter(
        (session) => session.sessionId !== sessionId
      ),
    }));
  }

  private async rotateSession(sessionId: string, refreshToken: string) {
    await this.data.update((store) => ({
      ...store,
      sessions: this.pruneExpiredSessions(store.sessions).map((session) =>
        session.sessionId === sessionId
          ? {
              ...session,
              refreshToken,
              expiresAt: new Date(Date.now() + this.config.sessionTtlMs).toISOString(),
            }
          : session
      ),
    }));
  }

  private async findSessionByRefreshToken(refreshToken: string) {
    const sessions = await this.getActiveSessions();
    return sessions.find((session) => session.refreshToken === refreshToken) ?? null;
  }

  private async issueTokens(user: UserRecord): Promise<AuthTokens> {
    return this.auth.signTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async signup(email: string, password: string): Promise<AuthResult> {
    const user = await this.users.createUser(email, password);
    const tokens = await this.issueTokens(user);
    await this.createSession(user.id, tokens.refreshToken);
    return { user: this.users.getSafeUser(user), tokens };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.users.verifyCredentials(email, password);
    const tokens = await this.issueTokens(user);
    await this.createSession(user.id, tokens.refreshToken);
    return { user: this.users.getSafeUser(user), tokens };
  }

  async ensureDefaultAdmin() {
    const email =
      process.env.DEFAULT_ADMIN_EMAIL ??
      process.env.AUTH_DEFAULT_ADMIN_EMAIL ??
      process.env.ADMIN_EMAIL ??
      "";
    const password =
      process.env.DEFAULT_ADMIN_PASSWORD ??
      process.env.AUTH_DEFAULT_ADMIN_PASSWORD ??
      process.env.ADMIN_PASSWORD ??
      "";

    if (!email || !password) {
      return null;
    }

    const existing = await this.users.findByEmail(email);
    if (existing) {
      return this.users.getSafeUser(existing);
    }

    const user = await this.users.createUser(email, password, "admin");
    return this.users.getSafeUser(user);
  }

  async refreshTokens(refreshToken: string) {
    if (!refreshToken) {
      throw new ServiceError("Refresh token is required.", 400, "missing_refresh_token");
    }

    const session = await this.findSessionByRefreshToken(refreshToken);
    if (!session) {
      throw new ServiceError("Session not active.", 401, "session_not_active");
    }

    let payload;
    try {
      payload = await this.auth.verifyRefreshToken(refreshToken);
    } catch {
      await this.deleteSession(session.sessionId);
      throw new ServiceError("Invalid refresh token.", 401, "invalid_refresh_token");
    }

    if (payload.id !== session.userId) {
      await this.deleteSession(session.sessionId);
      throw new ServiceError("Invalid session owner.", 401, "invalid_session_owner");
    }

    const user = await this.users.findById(session.userId);
    if (!user) {
      await this.deleteSession(session.sessionId);
      throw new ServiceError("User not found.", 404, "user_not_found");
    }

    const tokens = await this.issueTokens(user);
    await this.rotateSession(session.sessionId, tokens.refreshToken);
    return tokens;
  }


  async updateUserRole(userId: string, role: UserRecord["role"]) {
    const user = await this.users.updateRole(userId, role);
    return this.users.getSafeUser(user);
  }

  async listUsers() {
    const users = await this.data.getUsers();
    return users.map((user) => this.users.getSafeUser(user));
  }

  async createStaffUser(email: string, password: string, role: UserRole) {
    if (role !== "staff") {
      throw new ServiceError("Staff role is required.", 403, "forbidden_role");
    }
    const user = await this.users.createUser(email, password, "staff");
    return this.users.getSafeUser(user);
  }

  async setUserActive(userId: string, active: boolean) {
    const user = await this.users.setActive(userId, active);
    return this.users.getSafeUser(user);
  }

  async logout(refreshToken: string) {
    if (!refreshToken) {
      return { message: "No refresh token provided" };
    }

    const session = await this.findSessionByRefreshToken(refreshToken);
    if (session) {
      await this.deleteSession(session.sessionId);
    }

    return { message: "Logged out successfully" };
  }

  async getMeFromAccessToken(token: string) {
    let payload;
    try {
      payload = await this.auth.verifyAccessToken(token);
    } catch {
      throw new ServiceError("Invalid or expired token.", 401, "invalid_token");
    }

    const user = await this.users.findById(payload.id);
    if (!user) {
      throw new ServiceError("User not found.", 404, "user_not_found");
    }

    return this.users.getSafeUser(user);
  }
}

const store = createAuthStore();
const dataService = new DataService(store);
const userService = new UserService(dataService);
const authConfig = resolveAuthConfig(secureAuth);

export const authService = new AuthService(dataService, userService, secureAuth, authConfig);
