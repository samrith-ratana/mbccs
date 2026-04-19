"use client";

import { useEffect, useMemo, useState } from "react";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { apiFetch } from "@/lib/apiClient";
import Link from "next/link";

type Subscriber = {
  id: string;
};

type Product = {
  id: string;
  active: boolean;
};

type Invoice = {
  id: string;
  status: string;
};

type Payment = {
  id: string;
  status: string;
  createdAt?: string;
};

function isSameDay(value: string | undefined, compare: Date) {
  if (!value) return false;
  const date = new Date(value);
  return (
    date.getFullYear() === compare.getFullYear() &&
    date.getMonth() === compare.getMonth() &&
    date.getDate() === compare.getDate()
  );
}

export default function Home() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    Promise.all([
      apiFetch<Subscriber[]>("/api/fixed-development/subscribers"),
      apiFetch<Product[]>("/api/fixed-development/products"),
      apiFetch<Invoice[]>("/api/fixed-development/invoices"),
      apiFetch<Payment[]>("/api/fixed-development/payments"),
    ]).then(([subsRes, productsRes, invoicesRes, paymentsRes]) => {
      if (!active) return;

      if (subsRes.ok) setSubscribers(subsRes.data);
      if (productsRes.ok) setProducts(productsRes.data);
      if (invoicesRes.ok) setInvoices(invoicesRes.data);
      if (paymentsRes.ok) setPayments(paymentsRes.data);

      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const activePackages = useMemo(
    () => products.filter((product) => product.active).length,
    [products]
  );

  const openInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status !== "paid" && invoice.status !== "void").length,
    [invoices]
  );

  const settledToday = useMemo(() => {
    const today = new Date();
    return payments.filter(
      (payment) =>
        payment.status === "completed" && isSameDay(payment.createdAt, today)
    ).length;
  }, [payments]);

  const subscriberCount = subscribers.length;
  const statValue = (value: number) => (isLoading ? "..." : value.toString());

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--text)]">
            Core system overview
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            One console for onboarding, package management, and revenue tracking.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="rounded-full bg-[var(--primary-soft)] px-4 py-2 text-sm font-semibold text-[var(--primary)]"
            href="/fixed-development/management"
          >
            Start onboarding
          </Link>
          <Link
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--muted)]"
            href="/fixed-development/requests"
          >
            Review requests
          </Link>
          <Link
            className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow)]"
            href="/services-packages"
          >
            New package
          </Link>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-4">
        <StatCard badge="Live" label="Subscribers" tone="ok" value={statValue(subscriberCount)} />
        <StatCard badge="Catalog" label="Active packages" tone="ok" value={statValue(activePackages)} />
        <StatCard badge="Billing" label="Open invoices" tone="warn" value={statValue(openInvoices)} />
        <StatCard badge="Payments" label="Settled today" tone="ok" value={statValue(settledToday)} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold">Onboarding pipeline</p>
              <p className="text-sm text-[var(--muted)]">
                Track subscriber intake and contract flow.
              </p>
            </div>
            <StatusBadge tone="neutral">Workflow</StatusBadge>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Requests queue</span>
              <Link className="font-semibold text-[var(--primary)]" href="/fixed-development/requests">
                Open
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <span>Management flow</span>
              <Link className="font-semibold text-[var(--primary)]" href="/fixed-development/management">
                Launch
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <span>Payment review</span>
              <Link className="font-semibold text-[var(--primary)]" href="/payment-business">
                Review
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold">Package operations</p>
              <p className="text-sm text-[var(--muted)]">
                Maintain what is available for sale.
              </p>
            </div>
            <StatusBadge tone="ok">Catalog</StatusBadge>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Create packages</span>
              <Link className="font-semibold text-[var(--primary)]" href="/services-packages">
                Create
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <span>Active packages</span>
              <Link className="font-semibold text-[var(--primary)]" href="/list-packages">
                View
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <span>Inventory catalog</span>
              <Link className="font-semibold text-[var(--primary)]" href="/inventory-management">
                Manage
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold">Insights</p>
              <p className="text-sm text-[var(--muted)]">
                KPI summaries and operational reports.
              </p>
            </div>
            <StatusBadge tone="neutral">Reporting</StatusBadge>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Executive reports</span>
              <Link className="font-semibold text-[var(--primary)]" href="/reports">
                Open
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <span>Payment business</span>
              <Link className="font-semibold text-[var(--primary)]" href="/payment-business">
                Track
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <span>Fixed development</span>
              <Link className="font-semibold text-[var(--primary)]" href="/fixed-development">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-base font-semibold">System checklist</p>
            <p className="text-sm text-[var(--muted)]">
              Quick links to keep operations moving.
            </p>
          </div>
          <StatusBadge tone="neutral">Action center</StatusBadge>
        </div>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded-xl border border-[var(--border)] bg-white p-4">
            <div className="text-xs text-[var(--muted)]">Onboarding</div>
            <div className="mt-1 font-semibold">Handle new subscriber requests</div>
            <Link className="mt-3 inline-flex text-xs font-semibold text-[var(--primary)]" href="/fixed-development/requests">
              Go to requests
            </Link>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-white p-4">
            <div className="text-xs text-[var(--muted)]">Packages</div>
            <div className="mt-1 font-semibold">Publish or retire service tiers</div>
            <Link className="mt-3 inline-flex text-xs font-semibold text-[var(--primary)]" href="/services-packages">
              Manage packages
            </Link>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-white p-4">
            <div className="text-xs text-[var(--muted)]">Billing</div>
            <div className="mt-1 font-semibold">Record payments and track invoices</div>
            <Link className="mt-3 inline-flex text-xs font-semibold text-[var(--primary)]" href="/payment-business">
              Review payments
            </Link>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-white p-4">
            <div className="text-xs text-[var(--muted)]">Reporting</div>
            <div className="mt-1 font-semibold">Monitor KPIs and operational health</div>
            <Link className="mt-3 inline-flex text-xs font-semibold text-[var(--primary)]" href="/reports">
              View reports
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
