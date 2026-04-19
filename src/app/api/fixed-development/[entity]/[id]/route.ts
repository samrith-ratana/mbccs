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

function parseId(entityKey: EntityKey, rawId: string) {
  const definition = ENTITY_DEFINITIONS[entityKey];
  if (definition.autoId) {
    const numeric = Number(rawId);
    if (Number.isNaN(numeric)) {
      return null;
    }
    return numeric;
  }
  return rawId;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ entity: string; id: string }> }
) {
  const { entity, id: rawId } = await params;
  const entityKey = resolveEntity(entity);
  if (!entityKey) {
    return NextResponse.json({ error: "Unknown entity." }, { status: 404 });
  }

  const id = parseId(entityKey, rawId);
  if (id === null) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const record = await ENTITY_SERVICES[entityKey].getById(id);
  if (!record) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ data: record });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string; id: string }> }
) {
  const auth = requireRole(
    request.headers.get("authorization"),
    request.headers.get("x-user-role"),
    ["admin"]
  );
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { entity, id: rawId } = await params;
  const entityKey = resolveEntity(entity);
  if (!entityKey) {
    return NextResponse.json({ error: "Unknown entity." }, { status: 404 });
  }

  const id = parseId(entityKey, rawId);
  if (id === null) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  try {
    const updated = await ENTITY_SERVICES[entityKey].update(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const definition = ENTITY_DEFINITIONS[entityKey];
    const idValue = (updated as Record<string, unknown>)[definition.idField] ?? id;
    await logActivity(request, {
      action: "update",
      entity: definition.table,
      entityId: idValue ? String(idValue) : String(id),
      summary: `Updated ${definition.label}`,
      metadata: { entity: definition.key },
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    if (isServiceError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    const definition = ENTITY_DEFINITIONS[entityKey];
    console.error("Failed to update entity", definition.table, error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ entity: string; id: string }> }
) {
  const auth = requireRole(
    _request.headers.get("authorization"),
    _request.headers.get("x-user-role"),
    ["admin"]
  );
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { entity, id: rawId } = await params;
  const entityKey = resolveEntity(entity);
  if (!entityKey) {
    return NextResponse.json({ error: "Unknown entity." }, { status: 404 });
  }

  const id = parseId(entityKey, rawId);
  if (id === null) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const removed = await ENTITY_SERVICES[entityKey].remove(id);
  if (!removed) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const definition = ENTITY_DEFINITIONS[entityKey];
  const idValue = (removed as Record<string, unknown>)[definition.idField] ?? id;
  await logActivity(_request, {
    action: "delete",
    entity: definition.table,
    entityId: idValue ? String(idValue) : String(id),
    summary: `Deleted ${definition.label}`,
    metadata: { entity: definition.key },
  });

  return NextResponse.json({ data: removed });
}
