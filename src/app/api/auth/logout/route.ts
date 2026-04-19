import { NextResponse, type NextRequest } from "next/server";
import { authService } from "@/services/AuthService";
import { secureAuth } from "@/lib/auth";
import { logActivity } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const accessCookie = process.env.AUTH_ACCESS_COOKIE ?? "cc_access_token";
  const refreshCookie = process.env.AUTH_REFRESH_COOKIE ?? "cc_refresh_token";
  const accessToken = request.cookies.get(accessCookie)?.value;
  const refreshToken = request.cookies.get(refreshCookie)?.value;

  let userId = "unknown";
  let role = "unknown";
  if (accessToken) {
    try {
      const payload = await secureAuth.verifyAccessToken(accessToken);
      userId = payload.id;
      role = payload.role;
    } catch {
      // Ignore token validation errors for logging.
    }
  }

  try {
    await authService.logout(refreshToken ?? "");
  } catch (error) {
    console.error("Logout failed", error);
  }

  await logActivity(request, {
    action: "logout",
    entity: "auth",
    summary: "Logged out",
    userId,
    role,
  });

  const response = NextResponse.json({ data: { message: "Logged out." } });
  secureAuth.clearSessionCookies(response);
  return response;
}
