import "server-only";

import oracledb from "oracledb";

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.fetchAsString = [oracledb.CLOB, oracledb.NCLOB];

let poolPromise: Promise<oracledb.Pool> | null = null;

function getConnectString() {
  if (process.env.ORACLE_CONNECT_STRING) {
    return process.env.ORACLE_CONNECT_STRING;
  }

  const host = process.env.ORACLE_HOST ?? "localhost";
  const port = Number(process.env.ORACLE_PORT ?? 1521);
  const service = process.env.ORACLE_SERVICE ?? process.env.ORACLE_SID ?? "XE";

  return `${host}:${port}/${service}`;
}

async function getPool() {
  if (!poolPromise) {
    poolPromise = oracledb.createPool({
      user: process.env.ORACLE_USER ?? "system",
      password: process.env.ORACLE_PASSWORD ?? "welcome123",
      connectString: getConnectString(),
      poolMin: Number(process.env.ORACLE_POOL_MIN ?? 1),
      poolMax: Number(process.env.ORACLE_POOL_MAX ?? 10),
      poolIncrement: Number(process.env.ORACLE_POOL_INC ?? 1),
    });
  }

  return poolPromise;
}

async function withConnection<T>(handler: (connection: oracledb.Connection) => Promise<T>) {
  const pool = await getPool();
  const connection = await pool.getConnection();

  try {
    return await handler(connection);
  } finally {
    await connection.close();
  }
}

export async function query<T = unknown>(
  sql: string,
  binds?: oracledb.BindParameters,
  options?: oracledb.ExecuteOptions
) {
  return withConnection(async (connection) => {
    const execOptions = options ?? {};
    const result = await connection.execute(sql, binds ?? {}, execOptions);
    return (result.rows ?? []) as T;
  });
}

export async function execute(
  sql: string,
  binds?: oracledb.BindParameters,
  options?: oracledb.ExecuteOptions
) {
  return withConnection(async (connection) => {
    return connection.execute(sql, binds ?? {}, { autoCommit: true, ...options });
  });
}

export async function transaction<T>(
  handler: (connection: oracledb.Connection) => Promise<T>
) {
  const pool = await getPool();
  const connection = await pool.getConnection();

  try {
    const result = await handler(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.close();
  }
}

export function toDbBoolean(value: boolean | null | undefined) {
  if (value === null || value === undefined) return null;
  return value ? 1 : 0;
}

export function fromDbBoolean(value: unknown) {
  return value === 1 || value === true || value === "1" || value === "true";
}

export function parseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  return value as T;
}

export function toJson(value: unknown) {
  return JSON.stringify(value ?? null);
}
