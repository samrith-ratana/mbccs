import { NextResponse, type NextRequest } from "next/server";
import { createId } from "@/lib/ids";
import {
  failedPaymentService,
  invoiceService,
  paymentService,
} from "@/services/fixedDevelopmentServices";
import { isServiceError } from "@/services/errors";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const missingFields = ["invoiceId", "method", "amount"].filter(
    (field) => body[field] === undefined || body[field] === null || body[field] === ""
  );

  if (missingFields.length > 0) {
    return NextResponse.json(
      { error: "Missing required fields.", fields: missingFields },
      { status: 400 }
    );
  }

  const { id } = await params;
  const traceId = body.traceId ?? createId("trace");

  if (body.simulateFailure) {
    try {
      await failedPaymentService.createFailedPayment({
        traceId,
        reason: body.reason ?? "Simulated gateway failure.",
        payload: body,
      });
    } catch (error) {
      if (isServiceError(error)) {
        return NextResponse.json(
          { error: error.message, code: error.code, traceId },
          { status: error.status }
        );
      }

      console.error("Failed to log failed payment", error);
    }

    return NextResponse.json(
      { error: "Payment failed.", traceId },
      { status: 400 }
    );
  }

  try {
    const created = await paymentService.createPayment({
      subscriberId: id,
      invoiceId: body.invoiceId,
      method: body.method,
      amount: Number(body.amount),
      status: body.status ?? "completed",
      traceId,
      qrReference: body.qrReference,
    });

    await invoiceService.updateInvoice(body.invoiceId, { status: "paid" });

    return NextResponse.json({ data: created });
  } catch (error) {
    if (isServiceError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code, traceId },
        { status: error.status }
      );
    }

    console.error("Failed to process payment", error);
    return NextResponse.json(
      { error: "Server error.", traceId },
      { status: 500 }
    );
  }
}
