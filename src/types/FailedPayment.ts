export interface FailedPayment {
  id: number;
  traceId: string;
  reason: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface FailedPaymentCreateInput {
  traceId: string;
  reason: string;
  payload: Record<string, unknown>;
}

export interface FailedPaymentUpdateInput {
  traceId?: string;
  reason?: string;
  payload?: Record<string, unknown>;
}
