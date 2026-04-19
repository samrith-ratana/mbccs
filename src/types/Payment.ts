export type PaymentMethod = "cash" | "qr" | "gateway";
export type PaymentStatus = "pending" | "completed" | "failed";

export interface Payment {
  id: string;
  subscriberId: string;
  invoiceId: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  traceId: string;
  qrReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentCreateInput {
  subscriberId: string;
  invoiceId: string;
  method: PaymentMethod;
  amount: number;
  traceId: string;
  qrReference?: string;
  status?: PaymentStatus;
}

export interface PaymentUpdateInput {
  status?: PaymentStatus;
  qrReference?: string;
}

export interface FailedPaymentLog {
  traceId: string;
  reason: string;
  payload: Record<string, unknown>;
  createdAt: string;
}
