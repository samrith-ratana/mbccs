type KhqrInput = {
  amount: number;
  currency?: string;
  mobileNumber?: string;
  storeLabel?: string;
  terminalLabel?: string;
  khqrType?: string;
  accountId?: string;
  accountName?: string;
  accountCity?: string;
  merchantId?: string;
  acquiringBank?: string;
  expirationTimestamp?: number;
  expiresInSeconds?: number;
  expiresInMinutes?: number;
};

type KhqrSuccess = {
  ok: true;
  qrString: string;
  md5?: string;
};

type KhqrFailure = {
  ok: false;
  error: string;
};

export type KhqrResult = KhqrSuccess | KhqrFailure;

export function buildKhqr(input: KhqrInput): KhqrResult {
  const { BakongKHQR, khqrData, IndividualInfo, MerchantInfo } = require("bakong-khqr");

  const khqr = new BakongKHQR();
  const currencyKey = String(
    input.currency ?? process.env.BAKONG_CURRENCY ?? "usd"
  ).toLowerCase();
  const currency = khqrData?.currency?.[currencyKey] ?? khqrData.currency.usd;

  const explicitExpirationRaw = Number(
    input.expirationTimestamp ?? process.env.BAKONG_EXPIRATION_TIMESTAMP ?? ""
  );
  const expiresInSecondsInput =
    input.expiresInSeconds ??
    (input.expiresInMinutes ? input.expiresInMinutes * 60 : undefined);
  const expiresInSecondsEnv = (() => {
    const seconds = Number(process.env.BAKONG_QR_EXPIRES_SECONDS ?? "");
    if (Number.isFinite(seconds) && seconds > 0) return seconds;
    const minutes = Number(process.env.BAKONG_QR_EXPIRES_MINUTES ?? "");
    if (Number.isFinite(minutes) && minutes > 0) return minutes * 60;
    return undefined;
  })();
  const ttlSeconds = expiresInSecondsInput ?? expiresInSecondsEnv ?? 600;
  const normalizeExpiration = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return null;
    // Accept seconds (10 digits) or milliseconds (13 digits).
    if (value < 1_000_000_000_000) {
      return Math.floor(value * 1000);
    }
    return Math.floor(value);
  };

  const normalizedExplicit = normalizeExpiration(explicitExpirationRaw);
  const expirationTimestamp =
    normalizedExplicit ?? Math.floor(Date.now() + ttlSeconds * 1000);

  const optionalData = {
    currency,
    amount: input.amount,
    mobileNumber: input.mobileNumber ?? undefined,
    storeLabel: input.storeLabel ?? process.env.BAKONG_STORE_LABEL ?? undefined,
    terminalLabel:
      input.terminalLabel ?? process.env.BAKONG_TERMINAL_LABEL ?? undefined,
    expirationTimestamp,
  };

  const accountId =
    input.accountId ?? process.env.BAKONG_MERCHANT_ID ?? "merchant@bkrt";
  const accountName =
    input.accountName ?? process.env.BAKONG_MERCHANT_NAME ?? "Merchant";
  const accountCity =
    input.accountCity ?? process.env.BAKONG_MERCHANT_CITY ?? "PHNOM PENH";
  const merchantId =
    input.merchantId ?? process.env.BAKONG_MERCHANT_STORE_ID ?? "000001";
  const acquiringBank =
    input.acquiringBank ?? process.env.BAKONG_ACQUIRING_BANK ?? "Bakong";
  const khqrType = (input.khqrType ?? process.env.BAKONG_QR_TYPE ?? "merchant")
    .toString()
    .toLowerCase();

  let result:
    | { data?: { qr?: string; md5?: string }; status?: { message?: string } }
    | undefined;

  if (khqrType === "individual") {
    const individualInfo = new IndividualInfo(accountId, accountName, accountCity);
    result = khqr.generateIndividual(individualInfo, optionalData);
  } else {
    const merchantInfo = new MerchantInfo(
      accountId,
      accountName,
      accountCity,
      merchantId,
      acquiringBank,
      optionalData
    );
    result = khqr.generateMerchant(merchantInfo);
  }

  if (!result?.data?.qr) {
    return {
      ok: false,
      error: result?.status?.message ?? "Failed to generate KHQR payload.",
    };
  }

  return { ok: true, qrString: result.data.qr, md5: result.data.md5 };
}
