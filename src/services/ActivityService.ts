import "server-only";

import { execute, parseJson, query, toJson } from "@/lib/db/oracle";
import type { ActivityCreateInput, ActivityLog } from "@/models/activity";

const ACTIVITY_COLUMNS =
  'id "id", userId "userId", role "role", action "action", entity "entity", entityId "entityId", summary "summary", ipAddress "ipAddress", userAgent "userAgent", metadata "metadata", createdAt "createdAt"';

function mapActivity(row: Record<string, unknown>): ActivityLog {
  const rawMetadata = row.metadata ?? null;
  const metadata =
    rawMetadata === null || rawMetadata === undefined
      ? null
      : parseJson<Record<string, unknown> | null>(rawMetadata, null);

  return {
    id: Number(row.id),
    userId: String(row.userId ?? ""),
    role: String(row.role ?? ""),
    action: String(row.action ?? "") as ActivityLog["action"],
    entity: row.entity ? String(row.entity) : null,
    entityId: row.entityId ? String(row.entityId) : null,
    summary: row.summary ? String(row.summary) : null,
    ipAddress: row.ipAddress ? String(row.ipAddress) : null,
    userAgent: row.userAgent ? String(row.userAgent) : null,
    createdAt: String(row.createdAt ?? ""),
    metadata,
  };
}

function now() {
  return new Date().toISOString();
}

type ActivityFilter = {
  userId?: string | null;
  action?: string | null;
  entity?: string | null;
  limit?: number;
};

export class ActivityService {
  async record(input: ActivityCreateInput) {
    const createdAt = input.createdAt ?? now();
    const metadata = input.metadata ? toJson(input.metadata) : null;

    await execute(
      `INSERT INTO staff_activity_log (userId, role, action, entity, entityId, summary, ipAddress, userAgent, metadata, createdAt)
       VALUES (:userId, :role, :action, :entity, :entityId, :summary, :ipAddress, :userAgent, :metadata, :createdAt)`,
      {
        userId: input.userId,
        role: input.role,
        action: input.action,
        entity: input.entity ?? null,
        entityId: input.entityId ?? null,
        summary: input.summary ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metadata,
        createdAt,
      }
    );
  }

  async list(filter: ActivityFilter = {}): Promise<ActivityLog[]> {
    const conditions: string[] = [];
    const binds: Record<string, unknown> = {};

    if (filter.userId) {
      conditions.push("userId = :userId");
      binds.userId = filter.userId;
    }

    if (filter.action) {
      conditions.push("action = :action");
      binds.action = filter.action;
    }

    if (filter.entity) {
      conditions.push("entity = :entity");
      binds.entity = filter.entity;
    }

    const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
    const limit = Math.max(1, Math.min(filter.limit ?? 200, 500));
    const rows = await query<Record<string, unknown>[]>(
      `SELECT ${ACTIVITY_COLUMNS} FROM staff_activity_log${whereClause} ORDER BY createdAt DESC, id DESC FETCH FIRST ${limit} ROWS ONLY`,
      binds
    );

    return rows.map((row) => mapActivity(row));
  }
}

export const activityService = new ActivityService();
