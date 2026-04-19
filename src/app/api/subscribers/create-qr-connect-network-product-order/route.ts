import { NextResponse, type NextRequest } from "next/server";
import { createId } from "@/lib/ids";
import { buildKhqr } from "@/lib/khqr";
import {
  failedPaymentService,
  paymentService,
} from "@/services/fixedDevelopmentServices";
import { isServiceError } from "@/services/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const missingFields = ["subscriberId", "invoiceId", "amount"].filter(
    (field) => body[field] === undefined || body[field] === null || body[field] === ""
  );

  if (missingFields.length > 0) {
    return NextResponse.json(
      { error: "Missing required fields.", fields: missingFields },
      { status: 400 }
    );
  }

  const traceId = body.traceId ?? createId("trace");
  const amount = Number(body.amount);

  const logFailure = async (reason: string) => {
    try {
      await failedPaymentService.createFailedPayment({
        traceId,
        reason,
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

    return NextResponse.json({ error: reason, traceId }, { status: 400 });
  };

  if (!Number.isFinite(amount) || amount <= 0) {
    return logFailure("Invalid payment amount.");
  }

  try {
    const result = buildKhqr({
      amount,
      currency: body.currency,
      mobileNumber: body.mobileNumber,
      storeLabel: body.storeLabel,
      terminalLabel: body.terminalLabel,
      khqrType: body.khqrType ?? body.type,
      accountId: body.accountId,
      accountName: body.accountName,
      accountCity: body.accountCity,
      merchantId: body.merchantId,
      acquiringBank: body.acquiringBank,
      expirationTimestamp: body.expirationTimestamp,
      expiresInSeconds: body.expiresInSeconds,
      expiresInMinutes: body.expiresInMinutes,
    });

    if (!result.ok) {
      return logFailure(result.error);
    }

    const qrUrl = result.qrString;
    const qrReference = result.md5 ?? createId("qr");

    const payment = await paymentService.createPayment({
      subscriberId: body.subscriberId,
      invoiceId: body.invoiceId,
      method: "qr",
      amount,
      traceId,
      qrReference,
      status: "pending",
    });

    return NextResponse.json(
      {
        data: {
          qrUrl,
          qrReference,
          traceId,
          payment,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (isServiceError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code, traceId },
        { status: error.status }
      );
    }

    console.error("Failed to generate QR payment", error);
    return NextResponse.json(
      { error: "Server error.", traceId },
      { status: 500 }
    );
  }
}
