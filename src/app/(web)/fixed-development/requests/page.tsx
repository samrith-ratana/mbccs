"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import { apiFetch } from "@/lib/apiClient";

type Subscriber = {
  id: string;
  fullName: string;
  email: string;
  status?: string;
  createdAt?: string;
  profile?: { companyName?: string } | null;
};

export default function FixedRequestsPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    apiFetch<Subscriber[]>("/api/fixed-development/subscribers").then((result) => {
      if (!active) return;
      if (!result.ok) {
        setError(result.error ?? "Unable to load requests.");
        setIsLoading(false);
        return;
      }
      setSubscribers(result.data);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const pending = useMemo(
    () => subscribers.filter((subscriber) => (subscriber.status ?? "pending") === "pending"),
    [subscribers]
  );

  const badgeLabel = isLoading
    ? "Loading"
    : pending.length === 0
      ? "No new"
      : `${pending.length} new`;

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--text)]">
            Receiving requests
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Incoming camera service requests waiting for triage.
          </p>
        </div>
        <Link
          className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow)]"
          href="/fixed-development/management"
        >
          Create request
        </Link>
      </header>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-semibold">Request queue</p>
            <p className="text-sm text-[var(--muted)]">
              Assigned owners and SLA priorities.
            </p>
          </div>
          <StatusBadge tone={pending.length > 0 ? "warn" : "neutral"}>
            {badgeLabel}
          </StatusBadge>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-[var(--card)] text-[11px] uppercase tracking-wide text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 text-left">Request ID</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Company</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 text-[var(--muted)]" colSpan={5}>
                    Loading requests...
                  </td>
                </tr>
              ) : error ? (
                <tr className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 text-[var(--muted)]" colSpan={5}>
                    {error}
                  </td>
                </tr>
              ) : subscribers.length === 0 ? (
                <tr className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 text-[var(--muted)]" colSpan={5}>
                    No requests yet.
                  </td>
                </tr>
              ) : (
                subscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="border-t border-[var(--border)]">
                    <td className="px-4 py-3">{subscriber.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{subscriber.fullName}</div>
                      <div className="text-xs text-[var(--muted)]">{subscriber.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {subscriber.profile?.companyName ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        tone={(subscriber.status ?? "pending") === "pending" ? "warn" : "ok"}
                      >
                        {subscriber.status ?? "pending"}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--muted)]">
                      {subscriber.createdAt
                        ? new Date(subscriber.createdAt).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
