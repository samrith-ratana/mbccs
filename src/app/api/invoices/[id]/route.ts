import { NextResponse, type NextRequest } from "next/server";
import { invoiceService } from "@/services/fixedDevelopmentServices";
import { isServiceError } from "@/services/errors";
import { logActivity } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const invoice = await invoiceService.getInvoiceById(id);
  if (!invoice) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ data: invoice });
}

async function updateInvoice(request: NextRequest, id: string) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  try {
    const updated = await invoiceService.updateInvoice(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    await logActivity(request, {
      action: "update",
      entity: "invoices",
      entityId: id,
      summary: "Updated invoice",
      metadata: { invoiceId: id },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (isServiceError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    console.error("Failed to update invoice", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return updateInvoice(request, params.id);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return updateInvoice(request, params.id);
}
