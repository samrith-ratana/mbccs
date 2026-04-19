import { NextResponse, type NextRequest } from "next/server";
import { authService } from "@/services/AuthService";
import { requireRole } from "@/lib/auth";
import { isServiceError } from "@/services/errors";
import { logActivity } from "@/lib/audit";

export const dynamic = "force-dynamic";

const STAFF_ROLE = "staff";

function deny(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

function authorize(request: NextRequest) {
  return requireRole(
    request.headers.get("authorization"),
    request.headers.get("x-user-role"),
    ["admin"]
  );
}

export async function GET(request: NextRequest) {
  const auth = authorize(request);
  if (!auth.ok) {
    return deny(auth.status, auth.message);
  }

  await authService.ensureDefaultAdmin();
  const users = await authService.listUsers();
  return NextResponse.json({ data: users });
}

export async function POST(request: NextRequest) {
  const auth = authorize(request);
  if (!auth.ok) {
    return deny(auth.status, auth.message);
  }

  await authService.ensureDefaultAdmin();

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return deny(400, "Invalid JSON payload.");
  }

  const { email, password } = body as {
    email?: string;
    password?: string;
  };

  try {
    const created = await authService.createStaffUser(email ?? "", password ?? "", STAFF_ROLE);
    await logActivity(request, {
      action: "create",
      entity: "auth_users",
      entityId: created.id,
      summary: "Created staff account",
      metadata: { email: created.email, role: created.role },
    });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    if (isServiceError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    console.error("Failed to create staff user", error);
    return deny(500, "Server error.");
  }
}
