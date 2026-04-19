"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import { apiFetch } from "@/lib/apiClient";

type Subscriber = {
  id: string;
  fullName: string;
  status?: string;
  createdAt?: string;
};

type Contract = {
  id: string;
  status: string;
  createdAt?: string;
};

export default function FixedDevelopmentPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    Promise.all([
      apiFetch<Subscriber[]>("/api/fixed-development/subscribers"),
      apiFetch<Contract[]>("/api/fixed-development/contracts"),
    ]).then(([subsRes, contractsRes]) => {
      if (!active) return;

      const firstError =
        (!subsRes.ok && subsRes.error) ||
        (!contractsRes.ok && contractsRes.error);

      if (firstError) {
        setError(firstError);
        setIsLoading(false);
        return;
      }

      if (subsRes.ok) setSubscribers(subsRes.data);
      if (contractsRes.ok) setContracts(contractsRes.data);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const pendingCount = subscribers.filter(
    (subscriber) => (subscriber.status ?? "pending") === "pending"
  ).length;
  const activeContracts = contracts.filter(
    (contract) => contract.status === "active"
  ).length;

  const recentSubscribers = [...subscribers]
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    .slice(0, 3);

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--text)]">
            Subscriber onboarding
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Receive new camera service requests and onboard subscribers.
          </p>
        </div>
        <Link
          className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow)]"
          href="/fixed-development/management"
        >
          Launch workflow
        </Link>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold">Receiving request</p>
              <p className="text-sm text-[var(--muted)]">
                Capture new camera service requests and assign owners.
              </p>
            </div>
            <StatusBadge tone={pendingCount > 0 ? "warn" : "neutral"}>
              {isLoading ? "Loading" : `${pendingCount} pending`}
            </StatusBadge>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            {isLoading ? (
              <p className="text-[var(--muted)]">Loading recent requests...</p>
            ) : error ? (
              <p className="text-[var(--muted)]">{error}</p>
            ) : recentSubscribers.length === 0 ? (
              <p className="text-[var(--muted)]">No onboarding requests yet.</p>
            ) : (
              recentSubscribers.map((subscriber) => (
                <div key={subscriber.id} className="flex items-center justify-between">
                  <span>{subscriber.fullName}</span>
                  <span className="text-xs text-[var(--muted)]">
                    {subscriber.status ?? "pending"}
                  </span>
                </div>
              ))
            )}
            <Link
              className="inline-flex rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--muted)]"
              href="/fixed-development/requests"
            >
              Open request queue
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold">Onboarding workflow</p>
              <p className="text-sm text-[var(--muted)]">
                Run the subscriber workflow and payment activation.
              </p>
            </div>
            <StatusBadge tone={activeContracts > 0 ? "ok" : "neutral"}>
              {isLoading ? "Loading" : `${activeContracts} active`}
            </StatusBadge>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <p>Multi-step onboarding with invoice and payment preview.</p>
            <Link
              className="inline-flex rounded-full bg-[var(--primary-soft)] px-4 py-2 text-xs font-semibold text-[var(--primary)]"
              href="/fixed-development/management"
            >
              Start subscription
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
