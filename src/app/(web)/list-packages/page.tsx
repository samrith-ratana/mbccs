"use client";

import { useEffect, useMemo, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import { apiFetch } from "@/lib/apiClient";

type Product = {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  billingCycle: string;
  active: boolean;
};

export default function ListPackagesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeProducts = useMemo(
    () => products.filter((product) => product.active),
    [products]
  );

  const loadProducts = async () => {
    setIsLoading(true);
    setError(null);
    const result = await apiFetch<Product[]>("/api/fixed-development/products");
    if (!result.ok) {
      setError(result.error ?? "Unable to load packages.");
      setIsLoading(false);
      return;
    }
    setProducts(result.data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--text)]">
            Packages for sale
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Active service packages available for new subscribers.
          </p>
        </div>
        <StatusBadge tone={activeProducts.length === 0 ? "neutral" : "ok"}>
          {isLoading ? "Loading" : `${activeProducts.length} active`}
        </StatusBadge>
      </header>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-base font-semibold">Active packages</p>
            <p className="text-sm text-[var(--muted)]">
              Only packages marked active are shown.
            </p>
          </div>
          <button
            className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--muted)]"
            type="button"
            onClick={loadProducts}
          >
            Refresh
          </button>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-[var(--card)] text-[11px] uppercase tracking-wide text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 text-left">Package</th>
                <th className="px-4 py-3 text-left">Billing</th>
                <th className="px-4 py-3 text-left">Price</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr className="border-t border-[var(--border)]">
                  <td className="px-4 py-4 text-[var(--muted)]" colSpan={3}>
                    Loading packages...
                  </td>
                </tr>
              ) : error ? (
                <tr className="border-t border-[var(--border)]">
                  <td className="px-4 py-4 text-[var(--muted)]" colSpan={3}>
                    {error}
                  </td>
                </tr>
              ) : activeProducts.length === 0 ? (
                <tr className="border-t border-[var(--border)]">
                  <td className="px-4 py-4 text-[var(--muted)]" colSpan={3}>
                    No active packages available.
                  </td>
                </tr>
              ) : (
                activeProducts.map((pkg) => (
                  <tr key={pkg.id} className="border-t border-[var(--border)]">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{pkg.name}</div>
                      <div className="text-xs text-[var(--muted)]">{pkg.description}</div>
                    </td>
                    <td className="px-4 py-3">{pkg.billingCycle}</td>
                    <td className="px-4 py-3">${Number(pkg.unitPrice).toFixed(2)}</td>
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
