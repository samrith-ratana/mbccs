"use client";

import { useEffect, useMemo, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import { apiFetch } from "@/lib/apiClient";

type Subscriber = {
  id: string;
  fullName: string;
  email: string;
  status?: string;
  createdAt?: string;
};

type Invoice = {
  id: string;
  subscriberId: string;
  total: number;
  status: string;
  createdAt?: string;
};

type StatusState = {
  type: "idle" | "loading" | "success" | "error";
  message?: string;
  traceId?: string;
};

export default function PaymentBusinessPage() {
  const [query, setQuery] = useState("");
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [result, setResult] = useState<Subscriber | null>(null);
  const [status, setStatus] = useState<StatusState>({ type: "idle" });
  const [isLoading, setIsLoading] = useState(true);

  const latestInvoice = useMemo(() => {
    if (!result) return null;
    const related = invoices
      .filter((invoice) => invoice.subscriberId === result.id)
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    return related[0] ?? null;
  }, [invoices, result]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    Promise.all([
      apiFetch<Subscriber[]>("/api/fixed-development/subscribers"),
      apiFetch<Invoice[]>("/api/fixed-development/invoices"),
    ]).then(([subsRes, invoicesRes]) => {
      if (!active) return;

      if (!subsRes.ok) {
        setStatus({ type: "error", message: subsRes.error });
        setIsLoading(false);
        return;
      }

      if (!invoicesRes.ok) {
        setStatus({ type: "error", message: invoicesRes.error });
        setIsLoading(false);
        return;
      }

      setSubscribers(subsRes.data);
      setInvoices(invoicesRes.data);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleSearch = () => {
    setStatus({ type: "idle" });

    const search = query.trim().toLowerCase();
    if (!search) {
      setStatus({ type: "error", message: "Enter a customer name or email." });
      return;
    }

    const match = subscribers.find(
      (sub) =>
        sub.fullName.toLowerCase().includes(search) ||
        sub.email.toLowerCase().includes(search) ||
        sub.id.toLowerCase().includes(search)
    );

    if (!match) {
      setResult(null);
      setStatus({ type: "error", message: "No subscriber found." });
      return;
    }

    setResult(match);
    setStatus({ type: "success", message: "Subscriber found." });
  };

  const handleRecordPayment = async () => {
    if (!result || !latestInvoice) return;

    setStatus({ type: "loading", message: "Recording payment..." });

    const paymentResult = await apiFetch(`/api/subscribers/${result.id}/payment`, {
      method: "POST",
      body: {
        invoiceId: latestInvoice.id,
        method: "cash",
        amount: latestInvoice.total,
      },
    });

    if (!paymentResult.ok) {
      setStatus({
        type: "error",
        message: paymentResult.error,
        traceId: paymentResult.traceId,
      });
      return;
    }

    const refreshed = await apiFetch<Invoice[]>("/api/fixed-development/invoices");
    if (refreshed.ok) {
      setInvoices(refreshed.data);
    }

    setStatus({ type: "success", message: "Payment recorded." });
  };

  const isBusy = status.type === "loading" || isLoading;

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--text)]">
            Payment business
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Search subscribers and record invoice payments.
          </p>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <div>
            <p className="text-base font-semibold">Subscriber search</p>
            <p className="text-sm text-[var(--muted)]">
              Enter full name, email, or subscriber ID.
            </p>
          </div>
          <div className="mt-4 grid gap-3 text-sm">
            <label className="space-y-1 font-semibold">
              Search
              <input
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm disabled:bg-[var(--card)]"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Jane Doe or jane@company.com"
                disabled={isBusy}
              />
            </label>
            <button
              className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              type="button"
              onClick={handleSearch}
              disabled={isBusy}
            >
              Search
            </button>
            {status.type !== "idle" ? (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <StatusBadge tone={status.type === "error" ? "danger" : "ok"}>
                  {status.type}
                </StatusBadge>
                <span>{status.message}</span>
                {status.traceId ? (
                  <span className="text-[var(--muted)]">Trace: {status.traceId}</span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold">Subscriber status</p>
              <p className="text-sm text-[var(--muted)]">
                Latest invoice and payment actions.
              </p>
            </div>
            {result ? (
              <StatusBadge tone="ok">Found</StatusBadge>
            ) : (
              <StatusBadge tone="neutral">{isLoading ? "Loading" : "No match"}</StatusBadge>
            )}
          </div>

          {isLoading ? (
            <p className="mt-4 text-sm text-[var(--muted)]">
              Loading subscriber records...
            </p>
          ) : !result ? (
            <p className="mt-4 text-sm text-[var(--muted)]">
              Search for a subscriber to view invoices.
            </p>
          ) : (
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl border border-[var(--border)] bg-white p-3">
                <div className="text-xs text-[var(--muted)]">Subscriber</div>
                <div className="font-semibold">{result.fullName}</div>
                <div className="text-xs text-[var(--muted)]">{result.email}</div>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-white p-3">
                <div className="text-xs text-[var(--muted)]">Status</div>
                <div className="font-semibold">{result.status ?? "active"}</div>
              </div>

              {latestInvoice ? (
                <div className="rounded-xl border border-[var(--border)] bg-white p-3">
                  <div className="text-xs text-[var(--muted)]">Latest invoice</div>
                  <div className="font-semibold">{latestInvoice.id}</div>
                  <div className="text-xs text-[var(--muted)]">
                    Amount: ${Number(latestInvoice.total).toFixed(2)} ? {latestInvoice.status}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-xs text-[var(--muted)]">
                  No invoices found for this subscriber.
                </div>
              )}

              {latestInvoice && latestInvoice.status !== "paid" ? (
                <button
                  className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white"
                  type="button"
                  onClick={handleRecordPayment}
                  disabled={isBusy}
                >
                  Record payment
                </button>
              ) : latestInvoice ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-xs text-[var(--muted)]">
                  Invoice is already paid.
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
