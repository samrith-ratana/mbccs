import type { SafeUser, UserRecord, UserRole } from "@/models/user";
import { createId } from "@/lib/ids";
import { hashPassword, verifyPassword } from "@/lib/password";
import { ServiceError } from "@/services/errors";
import { DataService } from "@/services/DataService";

const SQL_PATTERN =
  /(--|;|\/\*|\*\/|\b(select|insert|update|delete|drop|alter|union|exec|truncate)\b|@@|\bchar\s*\(|\bnchar\s*\()/i;
const MAX_PASSWORD_LENGTH = 128;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function containsSqlInjection(value: string) {
  return SQL_PATTERN.test(value);
}

function hasUnsafeCharacters(value: string) {
  return /[\0\r\n]/.test(value);
}

function toSafeUser(user: UserRecord): SafeUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class UserService {
  private data: DataService;

  constructor(data: DataService) {
    this.data = data;
  }

  getSafeUser(user: UserRecord): SafeUser {
    return toSafeUser(user);
  }

  async findByEmail(email: string) {
    const normalized = normalizeEmail(email);
    const users = await this.data.getUsers();
    return users.find((user) => normalizeEmail(user.email) === normalized) ?? null;
  }

  async findById(id: string) {
    const users = await this.data.getUsers();
    return users.find((user) => user.id === id) ?? null;
  }

  private validateCredentials(email: string, password: string) {
    if (!email || !password) {
      throw new ServiceError("Email and password are required.", 400, "missing_credentials");
    }

    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      throw new ServiceError("Invalid email format.", 400, "invalid_email");
    }

    if (containsSqlInjection(normalized) || containsSqlInjection(password)) {
      throw new ServiceError("Invalid characters in credentials.", 400, "unsafe_input");
    }

    if (hasUnsafeCharacters(password)) {
      throw new ServiceError("Invalid characters in password.", 400, "unsafe_input");
    }

    if (password.length < 8) {
      throw new ServiceError("Password must be at least 8 characters.", 400, "weak_password");
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
      throw new ServiceError("Password is too long.", 400, "weak_password");
    }
  }

  async createUser(email: string, password: string, role?: UserRole) {
    this.validateCredentials(email, password);

    const users = await this.data.getUsers();
    const normalized = normalizeEmail(email);
    const existing = users.find((user) => normalizeEmail(user.email) === normalized) ?? null;
    if (existing) {
      throw new ServiceError("User already exists.", 409, "user_exists");
    }

    const now = new Date().toISOString();
    const user: UserRecord = {
      id: createId("usr", users.map((item) => item.id)),
      email: normalizeEmail(email),
      passwordHash: await hashPassword(password),
      role: role ?? ((process.env.CORE_SYSTEM_ROLE ?? "admin") as UserRole),
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.data.update((store) => ({
      ...store,
      users: [...store.users, user],
    }));

    return user;
  }


  async updateRole(id: string, role: UserRole) {
    const users = await this.data.getUsers();
    const user = users.find((item) => item.id == id) ?? null;
    if (!user) {
      throw new ServiceError("User not found.", 404, "user_not_found");
    }

    const updated: UserRecord = {
      ...user,
      role,
      updatedAt: new Date().toISOString(),
    };

    await this.data.update((store) => ({
      ...store,
      users: store.users.map((item) => (item.id == id ? updated : item)),
    }));

    return updated;
  }

  async setActive(id: string, active: boolean) {
    const users = await this.data.getUsers();
    const user = users.find((item) => item.id == id) ?? null;
    if (!user) {
      throw new ServiceError("User not found.", 404, "user_not_found");
    }

    const updated: UserRecord = {
      ...user,
      active,
      updatedAt: new Date().toISOString(),
    };

    await this.data.update((store) => ({
      ...store,
      users: store.users.map((item) => (item.id == id ? updated : item)),
    }));

    return updated;
  }

  async verifyCredentials(email: string, password: string) {
    this.validateCredentials(email, password);

    const user = await this.findByEmail(email);
    if (!user || !user.active) {
      throw new ServiceError("Invalid credentials.", 401, "invalid_credentials");
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new ServiceError("Invalid credentials.", 401, "invalid_credentials");
    }

    return user;
  }
}
