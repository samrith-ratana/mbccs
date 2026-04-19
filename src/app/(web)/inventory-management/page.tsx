"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import { apiFetch } from "@/lib/apiClient";

type Product = {
  id: string;
  name: string;
  billingCycle: string;
  unitPrice: number;
  active: boolean;
};

export default function InventoryManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    apiFetch<Product[]>("/api/fixed-development/products").then((result) => {
      if (!active) return;
      if (!result.ok) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      setProducts(result.data);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const activeCount = products.filter((product) => product.active !== false).length;
  const badgeLabel = isLoading
    ? "Loading"
    : products.length === 0
      ? "No packages"
      : `${activeCount} active`;
  const badgeTone = products.length === 0
    ? "neutral"
    : activeCount === products.length
      ? "ok"
      : "warn";

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--text)]">
            Package catalog
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Manage cloud storage packages and billing cycles.
          </p>
        </div>
        <Link
          className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow)]"
          href="/services-packages"
        >
          Add package
        </Link>
      </header>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-semibold">Package list</p>
            <p className="text-sm text-[var(--muted)]">
              Active subscription packages and pricing.
            </p>
          </div>
          <StatusBadge tone={badgeTone}>{badgeLabel}</StatusBadge>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-[var(--card)] text-[11px] uppercase tracking-wide text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 text-left">Package</th>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Billing cycle</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 text-[var(--muted)]" colSpan={5}>
                    Loading packages...
                  </td>
                </tr>
              ) : error ? (
                <tr className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 text-[var(--muted)]" colSpan={5}>
                    {error}
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 text-[var(--muted)]" colSpan={5}>
                    No packages configured yet.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-t border-[var(--border)]">
                    <td className="px-4 py-3">{product.name}</td>
                    <td className="px-4 py-3">{product.id}</td>
                    <td className="px-4 py-3">{product.billingCycle}</td>
                    <td className="px-4 py-3">${product.unitPrice.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={product.active !== false ? "ok" : "neutral"}>
                        {product.active !== false ? "Active" : "Inactive"}
                      </StatusBadge>
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
