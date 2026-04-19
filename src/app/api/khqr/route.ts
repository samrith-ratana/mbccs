import { NextResponse, type NextRequest } from "next/server";
import { buildKhqr } from "@/lib/khqr";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid payment amount." }, { status: 400 });
  }

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
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ qrString: result.qrString, md5: result.md5 });
}
