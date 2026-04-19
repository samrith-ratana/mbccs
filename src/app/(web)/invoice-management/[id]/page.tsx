"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import StatusBadge from "@/components/ui/StatusBadge";
import { apiFetch } from "@/lib/apiClient";

type InvoiceItem = {
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type Invoice = {
  id: string;
  subscriberId: string;
  total: number;
  status: string;
  items: InvoiceItem[];
  autoInvoice: boolean;
  createdAt?: string;
};

type Subscriber = {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
};

const COMPANY = {
  name: process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Company Name",
  address: process.env.NEXT_PUBLIC_COMPANY_ADDRESS ?? "Company address",
  phone: process.env.NEXT_PUBLIC_COMPANY_PHONE ?? "",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default function InvoicePrintPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [subscriber, setSubscriber] = useState<Subscriber | null>(null);
  const [error, setError] = useState<string | null>(null);

  const qrUrl = searchParams.get("qr");

  useEffect(() => {
    if (!params?.id) return;
    setError(null);
    apiFetch<Invoice>(`/api/invoices/${params.id}`).then((result) => {
      if (!result.ok) {
        setError(result.error ?? "Failed to load invoice.");
        return;
      }
      setInvoice(result.data);
    });
  }, [params?.id]);

  useEffect(() => {
    if (!invoice?.subscriberId) return;
    apiFetch<Subscriber[]>("/api/subscribers").then((result) => {
      if (!result.ok) return;
      const match = result.data.find((item) => item.id === invoice.subscriberId);
      setSubscriber(match ?? null);
    });
  }, [invoice?.subscriberId]);

  const totals = useMemo(() => {
    if (!invoice) return { subtotal: 0, total: 0 };
    const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
    const total = Number.isFinite(invoice.total) ? invoice.total : subtotal;
    return { subtotal, total };
  }, [invoice]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10 text-sm text-[var(--muted)]">
        {error}
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10 text-sm text-[var(--muted)]">
        Loading invoice...
      </div>
    );
  }

  const issueDate = invoice.createdAt
    ? new Date(invoice.createdAt)
    : new Date();

  return (
    <div className="min-h-screen bg-[var(--panel)] px-6 py-8 print:bg-white">
      <div className="mx-auto max-w-3xl space-y-4 print:max-w-none">
        <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
          <button
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--muted)]"
            type="button"
            onClick={() => router.back()}
          >
            Back
          </button>
          <button
            className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white"
            type="button"
            onClick={() => window.print()}
          >
            Print invoice
          </button>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-8 shadow-[var(--shadow)] print:border-none print:shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-[var(--text)]">
                Commercial Invoice
              </h1>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {COMPANY.name}
              </p>
              <p className="text-sm text-[var(--muted)]">{COMPANY.address}</p>
              {COMPANY.phone ? (
                <p className="text-sm text-[var(--muted)]">{COMPANY.phone}</p>
              ) : null}
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-sm">
              <div className="text-xs uppercase tracking-wide text-[var(--muted)]">
                Invoice No
              </div>
              <div className="font-semibold">{invoice.id}</div>
              <div className="mt-2 text-xs uppercase tracking-wide text-[var(--muted)]">
                Issue Date
              </div>
              <div className="font-semibold">
                {issueDate.toLocaleDateString()}
              </div>
              <div className="mt-2 text-xs uppercase tracking-wide text-[var(--muted)]">
                Status
              </div>
              <StatusBadge tone={invoice.status === "paid" ? "ok" : "warn"} size="sm">
                {invoice.status ?? "Pending"}
              </StatusBadge>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 text-sm">
              <div className="text-xs uppercase tracking-wide text-[var(--muted)]">
                Billed To
              </div>
              <div className="mt-2 font-semibold">
                {subscriber?.fullName ?? "Subscriber"}
              </div>
              {subscriber?.address ? (
                <div className="text-[var(--muted)]">{subscriber.address}</div>
              ) : null}
              {subscriber?.email ? (
                <div className="text-[var(--muted)]">{subscriber.email}</div>
              ) : null}
              {subscriber?.phone ? (
                <div className="text-[var(--muted)]">{subscriber.phone}</div>
              ) : null}
            </div>
            {qrUrl ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 text-center text-sm">
                <div className="text-xs uppercase tracking-wide text-[var(--muted)]">
                  Scan to Pay
                </div>
                <div className="mt-3 flex items-center justify-center">
                  <QRCode value={qrUrl} size={140} />
                </div>
                <div className="mt-2 text-xs text-[var(--muted)]">
                  KHQR payment
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--border)]">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-[var(--panel)] text-xs uppercase tracking-wide text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 text-left">Item</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Unit</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.name} className="border-t border-[var(--border)]">
                    <td className="px-4 py-3 font-semibold">{item.name}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {item.description}
                    </td>
                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-wrap items-start justify-between gap-6">
            <div className="text-xs text-[var(--muted)]">
              Thank you for your business. Please keep this invoice for your
              records.
            </div>
            <div className="min-w-[220px] rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted)]">Subtotal</span>
                <span className="font-semibold">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[var(--muted)]">Tax</span>
                <span className="font-semibold">{formatCurrency(0)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3 text-base font-semibold">
                <span>Total</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
