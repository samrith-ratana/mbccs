import "server-only";

import type { AuthStoreData, SessionRecord } from "@/models/auth";
import type { UserRecord } from "@/models/user";
import type { StoreAdapter } from "@/lib/storage";
import { fromDbBoolean, toDbBoolean, transaction } from "@/lib/db/oracle";
import type oracledb from "oracledb";

const USER_COLUMNS = "id \"id\", email \"email\", passwordHash \"passwordHash\", role \"role\", active \"active\", createdAt \"createdAt\", updatedAt \"updatedAt\"";
const SESSION_COLUMNS = "sessionId \"sessionId\", userId \"userId\", refreshToken \"refreshToken\", createdAt \"createdAt\", expiresAt \"expiresAt\"";

function mapUser(row: Record<string, unknown>): UserRecord {
  return {
    id: String(row.id),
    email: String(row.email),
    passwordHash: String(row.passwordHash),
    role: row.role as UserRecord["role"],
    active: fromDbBoolean(row.active),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  };
}

function mapSession(row: Record<string, unknown>): SessionRecord {
  return {
    sessionId: String(row.sessionId),
    userId: String(row.userId),
    refreshToken: String(row.refreshToken),
    createdAt: String(row.createdAt),
    expiresAt: String(row.expiresAt),
  };
}

async function readWithConnection(connection: oracledb.Connection): Promise<AuthStoreData> {
  const userResult = await connection.execute(
    `SELECT ${USER_COLUMNS} FROM auth_users ORDER BY createdAt DESC`
  );
  const sessionResult = await connection.execute(
    `SELECT ${SESSION_COLUMNS} FROM auth_sessions ORDER BY createdAt DESC`
  );

  const users = Array.isArray(userResult.rows)
    ? (userResult.rows as Record<string, unknown>[]).map(mapUser)
    : [];
  const sessions = Array.isArray(sessionResult.rows)
    ? (sessionResult.rows as Record<string, unknown>[]).map(mapSession)
    : [];

  return { users, sessions };
}

async function writeWithConnection(
  connection: oracledb.Connection,
  data: AuthStoreData
) {
  await connection.execute("DELETE FROM auth_sessions");
  await connection.execute("DELETE FROM auth_users");

  for (const user of data.users) {
    await connection.execute(
      "INSERT INTO auth_users (id, email, passwordHash, role, active, createdAt, updatedAt) VALUES (:id, :email, :passwordHash, :role, :active, :createdAt, :updatedAt)",
      {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role,
        active: toDbBoolean(user.active),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    );
  }

  for (const session of data.sessions) {
    await connection.execute(
      "INSERT INTO auth_sessions (sessionId, userId, refreshToken, createdAt, expiresAt) VALUES (:sessionId, :userId, :refreshToken, :createdAt, :expiresAt)",
      {
        sessionId: session.sessionId,
        userId: session.userId,
        refreshToken: session.refreshToken,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
      }
    );
  }
}

export class OracleAuthStore implements StoreAdapter<AuthStoreData> {
  async read(): Promise<AuthStoreData> {
    return transaction((connection) => readWithConnection(connection));
  }

  async write(data: AuthStoreData) {
    await transaction(async (connection) => {
      await writeWithConnection(connection, data);
    });
  }

  async update(
    mutator: (current: AuthStoreData) => AuthStoreData | Promise<AuthStoreData>
  ) {
    return transaction(async (connection) => {
      const current = await readWithConnection(connection);
      const next = await mutator(current);
      await writeWithConnection(connection, next);
      return next;
    });
  }
}
