"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DataTable from "@/components/ui/DataTable";
import ListToolbar from "@/components/ui/ListToolbar";
import StatusBadge, { type Tone } from "@/components/ui/StatusBadge";
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
  autoInvoice: boolean;
  items: InvoiceItem[];
};

const statusToneMap: Record<string, Tone> = {
  paid: "ok",
  completed: "ok",
  active: "ok",
  pending: "warn",
  unpaid: "warn",
  overdue: "danger",
  failed: "danger",
  cancelled: "neutral",
  canceled: "neutral",
  draft: "neutral",
};

export default function InvoiceManagementPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selected, setSelected] = useState<Invoice | null>(null);

  const loadInvoices = () => {
    apiFetch<Invoice[]>("/api/invoices").then((result) => {
      if (result.ok) {
        setInvoices(result.data);
        setSelected(result.data[0] ?? null);
      }
    });
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleExportCsv = () => {
    if (!selected) return;
    const headers = ["Item", "Description", "Qty", "Unit", "Total"];
    const rows = selected.items.map((item) => [
      item.name,
      item.description,
      String(item.quantity),
      String(item.unitPrice),
      String(item.total),
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice-${selected.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--text)]">
            Invoices
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Review camera storage invoices and automatic billing.
          </p>
        </div>
        <button
          className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--muted)]"
          type="button"
          onClick={loadInvoices}
        >
          Refresh
        </button>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)] lg:col-span-2">
          <ListToolbar
            title="Invoice list"
            description="Search, filter, and open invoices for review."
            countLabel={`${invoices.length} invoices`}
            searchPlaceholder="Search invoices, customers, or contract IDs"
            filters={[
              { label: "Paid", tone: "ok" },
              { label: "Pending", tone: "warn" },
              { label: "Overdue", tone: "danger" },
            ]}
          />
          <div className="mt-4">
            <DataTable
              columns={[
                { key: "id", label: "Invoice ID" },
                { key: "subscriberId", label: "Subscriber" },
                {
                  key: "total",
                  label: "Total",
                  render: (invoice) => `$${invoice.total.toFixed(2)}`,
                },
                {
                  key: "status",
                  label: "Status",
                  render: (invoice) => {
                    const normalized =
                      typeof invoice.status === "string"
                        ? invoice.status.toLowerCase()
                        : "";
                    const tone = statusToneMap[normalized] ?? "neutral";
                    return (
                      <StatusBadge tone={tone} size="sm">
                        {invoice.status ?? "Unknown"}
                      </StatusBadge>
                    );
                  },
                },
                {
                  key: "autoInvoice",
                  label: "Auto",
                  render: (invoice) => (
                    <StatusBadge tone={invoice.autoInvoice ? "ok" : "neutral"} size="sm">
                      {invoice.autoInvoice ? "Enabled" : "Manual"}
                    </StatusBadge>
                  ),
                },
              ]}
              rows={invoices}
              getRowKey={(invoice) => invoice.id}
              emptyMessage="No invoices yet. Create one in the workflow."
              onRowClick={setSelected}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-base font-semibold">Invoice preview</p>
              <p className="text-sm text-[var(--muted)]">
                {selected ? "Preview selected invoice" : "Select an invoice"}
              </p>
            </div>
          </div>
          {selected ? (
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl border border-[var(--border)] bg-white p-3">
                <div className="text-xs text-[var(--muted)]">Invoice ID</div>
                <div className="font-semibold">{selected.id}</div>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-white p-3">
                <div className="text-xs text-[var(--muted)]">Total</div>
                <div className="text-lg font-semibold">
                  ${selected.total.toFixed(2)}
                </div>
              </div>
              <button
                className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white"
                type="button"
                onClick={handleExportCsv}
              >
                Export CSV
              </button>
              <Link
                className="inline-flex items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--muted)]"
                href={`/invoice-management/${selected.id}`}
              >
                Open Invoice
              </Link>
              <button
                className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--muted)]"
                type="button"
                onClick={() => window.print()}
              >
                Export PDF
              </button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--muted)]">
              Create an invoice in the onboarding workflow.
            </p>
          )}
        </div>
      </section>
    </>
  );
}


