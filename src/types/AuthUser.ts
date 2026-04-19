export type UserRole = "admin" | "staff";

export interface AuthUser {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUserCreateInput {
  email: string;
  passwordHash: string;
  role: UserRole;
  active?: boolean;
}

export interface AuthUserUpdateInput {
  email?: string;
  passwordHash?: string;
  role?: UserRole;
  active?: boolean;
}
