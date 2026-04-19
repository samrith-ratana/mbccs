import { NextResponse, type NextRequest } from "next/server";
import { contractService } from "@/services/fixedDevelopmentServices";
import { isServiceError } from "@/services/errors";
import { logActivity } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await contractService.list();
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const missingFields = [
    "subscriberId",
    "productIds",
    "startDate",
    "termMonths",
    "billingCycle",
  ].filter((field) => body[field] === undefined || body[field] === null || body[field] === "");

  if (missingFields.length > 0) {
    return NextResponse.json(
      { error: "Missing required fields.", fields: missingFields },
      { status: 400 }
    );
  }

  try {
    const created = await contractService.createContract({
      subscriberId: body.subscriberId,
      productIds: body.productIds,
      startDate: body.startDate,
      termMonths: Number(body.termMonths),
      billingCycle: body.billingCycle,
      status: body.status ?? "active",
      notes: body.notes,
    });

    await logActivity(request, {
      action: "create",
      entity: "contracts",
      entityId: (created as Record<string, unknown>).id ?? null,
      summary: "Created contract",
      metadata: { subscriberId: body.subscriberId },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    if (isServiceError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    console.error("Failed to create contract", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
