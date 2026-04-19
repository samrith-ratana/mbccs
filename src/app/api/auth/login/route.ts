import { NextResponse, type NextRequest } from "next/server";
import { authService } from "@/services/AuthService";
import { secureAuth } from "@/lib/auth";
import { isServiceError } from "@/services/errors";
import { logActivity } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const { email, password } = body as { email?: string; password?: string };

  try {
    await authService.ensureDefaultAdmin();
    const result = await authService.login(email ?? "", password ?? "");

    const response = NextResponse.json({ data: result });
    secureAuth.setSessionCookies(response, result.tokens, result.user.role);

    await logActivity(request, {
      action: "login",
      entity: "auth",
      entityId: result.user.id,
      summary: "Login successful",
      metadata: { email: result.user.email, role: result.user.role },
      userId: result.user.id,
      role: result.user.role,
    });

    return response;
  } catch (error) {
    if (isServiceError(error)) {
      await logActivity(request, {
        action: "failed_login",
        entity: "auth",
        summary: "Login failed",
        metadata: { email: email ?? "", code: error.code },
        userId: email ?? "unknown",
        role: "unknown",
      });
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    console.error("Login failed", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
