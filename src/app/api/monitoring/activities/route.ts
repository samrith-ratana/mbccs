import { NextResponse, type NextRequest } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { activityService } from "@/services/ActivityService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = getAuthContext(
    request.headers.get("authorization"),
    request.headers.get("x-user-role")
  );
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const requestedLimit = Number(searchParams.get("limit") ?? 200);
  const limit = Number.isFinite(requestedLimit) ? requestedLimit : 200;
  const action = searchParams.get("action");
  const entity = searchParams.get("entity");
  const requestedUserId = searchParams.get("userId");

  const userId = auth.role === "admin" ? requestedUserId : auth.userId;

  const data = await activityService.list({
    limit,
    userId: userId ?? undefined,
    action: action ?? undefined,
    entity: entity ?? undefined,
  });

  return NextResponse.json({ data });
}
