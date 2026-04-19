import { NextResponse, type NextRequest } from "next/server";
import { subscriberService } from "@/services/fixedDevelopmentServices";
import { isServiceError } from "@/services/errors";
import { logActivity } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await subscriberService.list();
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const missingFields = ["fullName", "email"].filter((field) => !body[field]);
  if (missingFields.length > 0) {
    return NextResponse.json(
      { error: "Missing required fields.", fields: missingFields },
      { status: 400 }
    );
  }

  try {
    const created = await subscriberService.createSubscriber({
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      address: body.address,
      status: body.status ?? "pending",
      profile: body.profile,
    });

    await logActivity(request, {
      action: "create",
      entity: "subscribers",
      entityId: (created as Record<string, unknown>).id ?? null,
      summary: "Created subscriber",
      metadata: { email: body.email },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    if (isServiceError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    console.error("Failed to create subscriber", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
