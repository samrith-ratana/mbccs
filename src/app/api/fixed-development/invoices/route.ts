import { NextResponse, type NextRequest } from "next/server";
import { invoiceService } from "@/services/fixedDevelopmentServices";
import { isServiceError } from "@/services/errors";
import { logActivity } from "@/lib/audit";

export const dynamic = "force-dynamic";

function calculateTotal(items: Array<Record<string, unknown>>) {
  return items.reduce((sum, item) => {
    const quantity = Number(item.quantity ?? 0);
    const unitPrice = Number(item.unitPrice ?? 0);
    const lineTotal = Number(item.total ?? quantity * unitPrice);
    return sum + (Number.isFinite(lineTotal) ? lineTotal : 0);
  }, 0);
}

export async function GET() {
  const data = await invoiceService.list();
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const missingFields = ["subscriberId", "contractId", "items"].filter(
    (field) => body[field] === undefined || body[field] === null
  );

  if (missingFields.length > 0) {
    return NextResponse.json(
      { error: "Missing required fields.", fields: missingFields },
      { status: 400 }
    );
  }

  const items = Array.isArray(body.items) ? body.items : [];
  const total = Number(body.total ?? calculateTotal(items));

  try {
    const created = await invoiceService.createInvoice({
      subscriberId: body.subscriberId,
      contractId: body.contractId,
      items,
      total,
      autoInvoice: body.autoInvoice ?? false,
      status: body.status ?? "draft",
    });

    await logActivity(request, {
      action: "create",
      entity: "invoices",
      entityId: (created as Record<string, unknown>).id ?? null,
      summary: "Created invoice",
      metadata: { subscriberId: body.subscriberId, contractId: body.contractId },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    if (isServiceError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    console.error("Failed to create invoice", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
