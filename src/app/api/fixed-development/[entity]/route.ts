import { NextResponse, type NextRequest } from "next/server";
import { ENTITY_DEFINITIONS } from "@/lib/fixedDevelopmentConfig";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/audit";
import {
  ENTITY_SERVICES,
  type EntityKey,
} from "@/services/fixedDevelopmentServices";
import { isServiceError } from "@/services/errors";

export const dynamic = "force-dynamic";

function resolveEntity(key: string): EntityKey | null {
  return Object.prototype.hasOwnProperty.call(ENTITY_SERVICES, key)
    ? (key as EntityKey)
    : null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  const { entity } = await params;
  const entityKey = resolveEntity(entity);
  if (!entityKey) {
    return NextResponse.json({ error: "Unknown entity." }, { status: 404 });
  }

  const data = await ENTITY_SERVICES[entityKey].list();
  return NextResponse.json({ data });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  const auth = requireRole(
    request.headers.get("authorization"),
    request.headers.get("x-user-role"),
    ["admin"]
  );
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { entity } = await params;
  const entityKey = resolveEntity(entity);
  if (!entityKey) {
    return NextResponse.json({ error: "Unknown entity." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  try {
    const created = await ENTITY_SERVICES[entityKey].create(body);
    const definition = ENTITY_DEFINITIONS[entityKey];
    const idValue = (created as Record<string, unknown>)[definition.idField];
    await logActivity(request, {
      action: "create",
      entity: definition.table,
      entityId: idValue ? String(idValue) : null,
      summary: `Created ${definition.label}`,
      metadata: { entity: definition.key },
    });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    if (isServiceError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    const definition = ENTITY_DEFINITIONS[entityKey];
    console.error("Failed to create entity", definition.table, error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
