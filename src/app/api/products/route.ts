import { NextResponse, type NextRequest } from "next/server";
import { productService } from "@/services/fixedDevelopmentServices";
import { isServiceError } from "@/services/errors";
import { logActivity } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await productService.list();
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const missingFields = ["name", "description", "unitPrice", "billingCycle"].filter(
    (field) => body[field] === undefined || body[field] === null || body[field] === ""
  );

  if (missingFields.length > 0) {
    return NextResponse.json(
      { error: "Missing required fields.", fields: missingFields },
      { status: 400 }
    );
  }

  try {
    const created = await productService.createProduct({
      name: body.name,
      description: body.description,
      unitPrice: Number(body.unitPrice),
      billingCycle: body.billingCycle,
      prepaidMonths: body.prepaidMonths ?? undefined,
      active: body.active ?? true,
    });

    await logActivity(request, {
      action: "create",
      entity: "products",
      entityId: (created as Record<string, unknown>).id ?? null,
      summary: "Created product",
      metadata: { name: body.name },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    if (isServiceError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    console.error("Failed to create product", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
