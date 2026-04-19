import { SignJWT, jwtVerify } from "jose";
import { verify as verifyJwt, JwtPayload } from "jsonwebtoken";
import type { AuthTokens } from "@/models/auth";
import type { UserRole } from "@/models/user";
export type { UserRole } from "@/models/user";

export interface AuthContext {
  userId: string;
  role: UserRole;
}

const DEFAULT_TOKEN = process.env.CORE_SYSTEM_TOKEN ?? "devtoken";
const DEFAULT_ROLE = (process.env.CORE_SYSTEM_ROLE ?? "admin") as UserRole;

export function getAuthContext(
  authHeader: string | null,
  roleHeader?: string | null
): AuthContext | null {
  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer") {
    return null;
  }

  if (token === DEFAULT_TOKEN) {
    const role = (roleHeader ?? DEFAULT_ROLE) as UserRole;
    return {
      userId: "staff-admin",
      role: role ?? "admin",
    };
  }

  try {
    const accessSecret = resolveSecret(
      ["AUTH_ACCESS_SECRET", "JWT_ACCESS_SECRET"],
      "dev_access_secret"
    );
    const decoded = verifyJwt(token, accessSecret) as JwtPayload;

    if (!decoded || typeof decoded !== "object" || typeof decoded.id !== "string") {
      return null;
    }

    const tokenRole = decoded.role as UserRole | undefined;
    const role = (roleHeader ?? tokenRole ?? DEFAULT_ROLE) as UserRole;
    return {
      userId: decoded.id,
      role: role ?? "admin",
    };
  } catch {
    return null;
  }
}

export function requireRole(
  authHeader: string | null,
  roleHeader: string | null,
  allowed: UserRole[]
) {
  const context = getAuthContext(authHeader, roleHeader);
  if (!context) {
    return { ok: false as const, status: 401, message: "Unauthorized" };
  }

  if (!allowed.includes(context.role)) {
    return { ok: false as const, status: 403, message: "Forbidden" };
  }

  return { ok: true as const, context };
}

export function isAuthorized(authHeader: string | null) {
  return getAuthContext(authHeader) !== null;
}

export interface SessionClaims {
  id: string;
  email: string;
  role: UserRole;
}

export interface SecureAuthConfig {
  accessSecret: string;
  refreshSecret: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
  issuer?: string;
  audience?: string;
  cookie: {
    accessName: string;
    refreshName: string;
    roleName: string;
    secure: boolean;
    sameSite: "lax" | "strict" | "none";
    path: string;
  };
}

type CookieOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
  path?: string;
  maxAge?: number;
};

type CookieTarget = {
  cookies: {
    set: (name: string, value: string, options: CookieOptions) => void;
  };
};

function resolveSecret(keys: string[], fallback: string) {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(`Missing auth secret. Checked: ${keys.join(", ")}`);
  }

  return fallback;
}

function resolveNumber(value: string | undefined, fallback: number) {
  const parsed = value ? Number(value) : fallback;
  return Number.isFinite(parsed) ? parsed : fallback;
}

export class SecureAuth {
  private accessSecret: Uint8Array;
  private refreshSecret: Uint8Array;
  private accessTtlSeconds: number;
  private refreshTtlSeconds: number;
  private issuer?: string;
  private audience?: string;
  private cookie: SecureAuthConfig["cookie"];

  constructor(config: SecureAuthConfig) {
    this.accessSecret = new TextEncoder().encode(config.accessSecret);
    this.refreshSecret = new TextEncoder().encode(config.refreshSecret);
    this.accessTtlSeconds = config.accessTokenTtlSeconds;
    this.refreshTtlSeconds = config.refreshTokenTtlSeconds;
    this.issuer = config.issuer;
    this.audience = config.audience;
    this.cookie = config.cookie;
  }

  static fromEnv() {
    const accessSecret = resolveSecret(
      ["AUTH_ACCESS_SECRET", "JWT_ACCESS_SECRET"],
      "dev_access_secret"
    );
    const refreshSecret =
      process.env.AUTH_REFRESH_SECRET ??
      process.env.JWT_REFRESH_SECRET ??
      accessSecret;

    const accessTokenTtlSeconds = resolveNumber(
      process.env.AUTH_ACCESS_TTL_SECONDS,
      60 * 15
    );
    const refreshTokenTtlSeconds = resolveNumber(
      process.env.AUTH_REFRESH_TTL_SECONDS,
      60 * 60 * 24 * 7
    );

    return new SecureAuth({
      accessSecret,
      refreshSecret,
      accessTokenTtlSeconds,
      refreshTokenTtlSeconds,
      issuer: process.env.AUTH_JWT_ISSUER,
      audience: process.env.AUTH_JWT_AUDIENCE,
      cookie: {
        accessName: process.env.AUTH_ACCESS_COOKIE ?? "cc_access_token",
        refreshName: process.env.AUTH_REFRESH_COOKIE ?? "cc_refresh_token",
        roleName: process.env.AUTH_ROLE_COOKIE ?? "cc_role",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      },
    });
  }

  get refreshTokenTtlSeconds() {
    return this.refreshTtlSeconds;
  }

  private async signToken(
    claims: SessionClaims,
    ttlSeconds: number,
    secret: Uint8Array
  ) {
    const jwt = new SignJWT({
      id: claims.id,
      email: claims.email,
      role: claims.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${ttlSeconds}s`)
      .setSubject(claims.id);

    if (this.issuer) {
      jwt.setIssuer(this.issuer);
    }

    if (this.audience) {
      jwt.setAudience(this.audience);
    }

    return jwt.sign(secret);
  }

  async signAccessToken(claims: SessionClaims) {
    return this.signToken(claims, this.accessTtlSeconds, this.accessSecret);
  }

  async signRefreshToken(claims: SessionClaims) {
    return this.signToken(claims, this.refreshTtlSeconds, this.refreshSecret);
  }

  async signTokens(claims: SessionClaims): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(claims),
      this.signRefreshToken(claims),
    ]);

    return { accessToken, refreshToken };
  }

  async verifyAccessToken(token: string) {
    const { payload } = await jwtVerify(token, this.accessSecret, {
      issuer: this.issuer,
      audience: this.audience,
    });

    return payload as unknown as SessionClaims;
  }

  async verifyRefreshToken(token: string) {
    const { payload } = await jwtVerify(token, this.refreshSecret, {
      issuer: this.issuer,
      audience: this.audience,
    });

    return payload as unknown as SessionClaims;
  }

  setSessionCookies(target: CookieTarget, tokens: AuthTokens, role?: UserRole) {
    const baseOptions = {
      httpOnly: true,
      secure: this.cookie.secure,
      sameSite: this.cookie.sameSite,
      path: this.cookie.path,
    } satisfies CookieOptions;

    target.cookies.set(this.cookie.accessName, tokens.accessToken, {
      ...baseOptions,
      maxAge: this.accessTtlSeconds,
    });

    target.cookies.set(this.cookie.refreshName, tokens.refreshToken, {
      ...baseOptions,
      maxAge: this.refreshTtlSeconds,
    });

    if (role) {
      target.cookies.set(this.cookie.roleName, role, {
        ...baseOptions,
        maxAge: this.refreshTtlSeconds,
      });
    }
  }

  clearSessionCookies(target: CookieTarget) {
    const baseOptions = {
      httpOnly: true,
      secure: this.cookie.secure,
      sameSite: this.cookie.sameSite,
      path: this.cookie.path,
      maxAge: 0,
    } satisfies CookieOptions;

    target.cookies.set(this.cookie.accessName, "", baseOptions);
    target.cookies.set(this.cookie.refreshName, "", baseOptions);
    target.cookies.set(this.cookie.roleName, "", baseOptions);
  }
}

export const secureAuth = SecureAuth.fromEnv();


