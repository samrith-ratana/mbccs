"use client";

import { useEffect, useMemo, useState } from "react";
import StatusBadge, { type Tone } from "@/components/ui/StatusBadge";
import { apiFetch } from "@/lib/apiClient";

type Invoice = {
  id: string;
  subscriberId: string;
  total: number;
  status: string;
  createdAt?: string;
};

const statusToneMap: Record<string, Tone> = {
  paid: "ok",
  completed: "ok",
  pending: "warn",
  unpaid: "warn",
  overdue: "danger",
  failed: "danger",
  draft: "neutral",
  active: "neutral",
};

const settledStatuses = new Set(["paid", "completed"]);

function parseDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function formatPeriod(value?: string) {
  const date = parseDate(value);
  if (!date) return "-";
  return date.toLocaleString(undefined, { month: "short", year: "numeric" });
}

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function StatementManagerPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    apiFetch<Invoice[]>("/api/invoices").then((result) => {
      if (!active) return;
      if (!result.ok) {
        setError(result.error ?? "Unable to load invoices.");
        setIsLoading(false);
        return;
      }
      setInvoices(result.data);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const outstanding = useMemo(() => {
    return invoices.reduce((sum, invoice) => {
      const status = invoice.status?.toLowerCase?.() ?? "";
      if (settledStatuses.has(status)) return sum;
      const total = Number(invoice.total ?? 0);
      return sum + (Number.isFinite(total) ? total : 0);
    }, 0);
  }, [invoices]);

  const pendingCount = useMemo(() => {
    return invoices.filter((invoice) => {
      const status = invoice.status?.toLowerCase?.() ?? "";
      return status === "pending" || status === "unpaid" || status === "overdue";
    }).length;
  }, [invoices]);

  const dueSoonCount = useMemo(() => {
    const now = Date.now();
    const soon = now + 7 * 24 * 60 * 60 * 1000;
    return invoices.filter((invoice) => {
      const status = invoice.status?.toLowerCase?.() ?? "";
      if (settledStatuses.has(status)) return false;
      const created = parseDate(invoice.createdAt);
      if (!created) return false;
      const due = created.getTime() + 30 * 24 * 60 * 60 * 1000;
      return due >= now && due <= soon;
    }).length;
  }, [invoices]);

  const tableRows = useMemo(() => {
    return invoices.map((invoice) => {
      const created = parseDate(invoice.createdAt);
      const due = created ? new Date(created.getTime() + 30 * 24 * 60 * 60 * 1000) : null;
      const status = invoice.status?.toLowerCase?.() ?? "";
      const tone = statusToneMap[status] ?? "neutral";
      const actionLabel =
        status === "overdue" ? "Remind" : status === "pending" ? "Review" : "View";
      const actionClass =
        status === "overdue"
          ? "rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--primary)]"
          : "rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--muted)]";

      return {
        id: invoice.id,
        customer: invoice.subscriberId,
        period: formatPeriod(invoice.createdAt),
        amount: formatCurrency(Number(invoice.total ?? 0)),
        due: due ? due.toLocaleDateString() : "-",
        statusLabel: invoice.status ?? "Unknown",
        statusTone: tone,
        owner: "Finance",
        actionLabel,
        actionClass,
      };
    });
  }, [invoices]);

  const summaryLabel = isLoading
    ? "Loading invoices..."
    : error
      ? error
      : `${pendingCount} invoices awaiting payment confirmation.`;

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--text)]">
            Billing cycles
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Generate billing statements and aging summaries.
          </p>
        </div>
        <button
          className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow)]"
          type="button"
        >
          Generate statement
        </button>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold">Outstanding balance</p>
              <p className="text-sm text-[var(--muted)]">
                Current unpaid camera storage invoices.
              </p>
            </div>
            <StatusBadge tone="warn">{formatCurrency(outstanding)}</StatusBadge>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <p>{summaryLabel}</p>
            <p>{dueSoonCount} invoices approaching due date within 7 days.</p>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold">Statement schedule</p>
              <p className="text-sm text-[var(--muted)]">
                Upcoming monthly statement runs.
              </p>
            </div>
            <StatusBadge tone="ok">On track</StatusBadge>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            <li>Mar 20: Enterprise subscribers</li>
            <li>Mar 25: Mid-market subscribers</li>
            <li>Mar 30: SMB subscribers</li>
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-base font-semibold">Statement list</p>
            <p className="text-sm text-[var(--muted)]">
              Manage billing cycles, owners, and reminders.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--muted)]"
              type="button"
            >
              Export list
            </button>
            <button
              className="rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow)]"
              type="button"
            >
              Send reminders
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <label className="space-y-1 text-xs font-semibold text-[var(--muted)]">
            Search
            <input
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
              placeholder="Statement ID or customer"
              type="search"
            />
          </label>
          <label className="space-y-1 text-xs font-semibold text-[var(--muted)]">
            Status
            <select className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm">
              <option>All</option>
              <option>Paid</option>
              <option>Pending</option>
              <option>Overdue</option>
            </select>
          </label>
          <label className="space-y-1 text-xs font-semibold text-[var(--muted)]">
            Period
            <select className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm">
              <option>Last 30 days</option>
              <option>Last 90 days</option>
              <option>Year to date</option>
            </select>
          </label>
          <label className="space-y-1 text-xs font-semibold text-[var(--muted)]">
            Owner
            <select className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm">
              <option>All teams</option>
              <option>Finance</option>
              <option>Onboarding</option>
              <option>Support</option>
            </select>
          </label>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-[var(--card)] text-[11px] uppercase tracking-wide text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input type="checkbox" className="h-4 w-4" />
                </th>
                <th className="px-4 py-3 text-left">Statement</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Period</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Due</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Owner</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 text-[var(--muted)]" colSpan={9}>
                    Loading invoices...
                  </td>
                </tr>
              ) : error ? (
                <tr className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 text-[var(--muted)]" colSpan={9}>
                    {error}
                  </td>
                </tr>
              ) : tableRows.length === 0 ? (
                <tr className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 text-[var(--muted)]" colSpan={9}>
                    No statements yet.
                  </td>
                </tr>
              ) : (
                tableRows.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--border)]">
                    <td className="px-4 py-3">
                      <input type="checkbox" className="h-4 w-4" />
                    </td>
                    <td className="px-4 py-3">{row.id}</td>
                    <td className="px-4 py-3">{row.customer}</td>
                    <td className="px-4 py-3">{row.period}</td>
                    <td className="px-4 py-3">{row.amount}</td>
                    <td className="px-4 py-3">{row.due}</td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={row.statusTone}>{row.statusLabel}</StatusBadge>
                    </td>
                    <td className="px-4 py-3">{row.owner}</td>
                    <td className="px-4 py-3">
                      <button className={row.actionClass} type="button">
                        {row.actionLabel}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
          <span>
            Showing {tableRows.length === 0 ? 0 : 1}-{tableRows.length} of{" "}
            {tableRows.length} statements
          </span>
          <div className="flex gap-2">
            <button
              className="rounded-full border border-[var(--border)] px-3 py-1 font-semibold"
              type="button"
            >
              Previous
            </button>
            <button
              className="rounded-full border border-[var(--border)] px-3 py-1 font-semibold"
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
