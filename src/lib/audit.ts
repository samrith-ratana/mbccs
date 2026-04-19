import type { NextRequest } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { activityService } from "@/services/ActivityService";
import type { ActivityAction } from "@/models/activity";

type LogInput = {
  action: ActivityAction;
  entity?: string | null;
  entityId?: string | number | null;
  summary?: string | null;
  metadata?: Record<string, unknown> | null;
  userId?: string | null;
  role?: string | null;
};

function resolveIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }
  return request.headers.get("x-real-ip");
}

export async function logActivity(request: NextRequest | null, input: LogInput) {
  try {
    const context = request
      ? getAuthContext(
          request.headers.get("authorization"),
          request.headers.get("x-user-role")
        )
      : null;

    const userId = input.userId ?? context?.userId ?? "system";
    const role = input.role ?? context?.role ?? "system";
    const entityId =
      input.entityId === null || input.entityId === undefined
        ? null
        : String(input.entityId);

    const baseMetadata: Record<string, unknown> = {};
    if (request) {
      baseMetadata.path = request.nextUrl.pathname;
      baseMetadata.method = request.method;
    }

    const mergedMetadata = {
      ...baseMetadata,
      ...(input.metadata ?? {}),
    };

    await activityService.record({
      userId,
      role,
      action: input.action,
      entity: input.entity ?? null,
      entityId,
      summary: input.summary ?? null,
      ipAddress: request ? resolveIp(request) : null,
      userAgent: request?.headers.get("user-agent") ?? null,
      metadata: Object.keys(mergedMetadata).length > 0 ? mergedMetadata : null,
    });
  } catch (error) {
    console.error("Failed to log activity", error);
  }
}
