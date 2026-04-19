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
  prepaidMonths?: number | null;
  active: boolean;
  createdAt?: string;
};

type FormState = {
  name: string;
  description: string;
  unitPrice: string;
  billingCycle: string;
  prepaidMonths: string;
  active: boolean;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  unitPrice: "",
  billingCycle: "monthly",
  prepaidMonths: "",
  active: true,
};

export default function ServicesPackagesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeCount = useMemo(
    () => products.filter((item) => item.active).length,
    [products]
  );

  const badgeLabel = isLoading
    ? "Loading"
    : products.length === 0
      ? "No packages"
      : `${activeCount} active`;

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

  const handleSubmit = async () => {
    setError(null);
    if (!form.name.trim() || !form.description.trim() || !form.unitPrice.trim()) {
      setError("Name, description, and unit price are required.");
      return;
    }

    const unitPrice = Number(form.unitPrice);
    if (!Number.isFinite(unitPrice)) {
      setError("Unit price must be a number.");
      return;
    }

    const prepaidMonths = form.prepaidMonths.trim() === ""
      ? undefined
      : Number(form.prepaidMonths);

    const result = await apiFetch<Product>("/api/fixed-development/products", {
      method: "POST",
      body: {
        name: form.name.trim(),
        description: form.description.trim(),
        unitPrice,
        billingCycle: form.billingCycle,
        prepaidMonths: prepaidMonths && Number.isFinite(prepaidMonths) ? prepaidMonths : undefined,
        active: form.active,
      },
    });

    if (!result.ok) {
      setError(result.error ?? "Unable to create package.");
      return;
    }

    setForm(emptyForm);
    loadProducts();
  };

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--text)]">
            Services packages
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Create packages used when registering customers.
          </p>
        </div>
        <StatusBadge tone={products.length === 0 ? "neutral" : "ok"}>
          {badgeLabel}
        </StatusBadge>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <div>
            <p className="text-base font-semibold">Create package</p>
            <p className="text-sm text-[var(--muted)]">
              Define description, price, and billing cycle.
            </p>
          </div>
          <div className="mt-4 grid gap-3 text-sm">
            <label className="space-y-1 font-semibold">
              Package name
              <input
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Standard"
              />
            </label>
            <label className="space-y-1 font-semibold">
              Description
              <textarea
                className="min-h-[90px] w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="30-day retention, 200GB per camera."
              />
            </label>
            <label className="space-y-1 font-semibold">
              Unit price
              <input
                type="number"
                min={0}
                step="0.01"
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                value={form.unitPrice}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, unitPrice: event.target.value }))
                }
              />
            </label>
            <label className="space-y-1 font-semibold">
              Billing cycle
              <select
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                value={form.billingCycle}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, billingCycle: event.target.value }))
                }
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </label>
            <label className="space-y-1 font-semibold">
              Prepaid months (optional)
              <input
                type="number"
                min={1}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                value={form.prepaidMonths}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, prepaidMonths: event.target.value }))
                }
              />
            </label>
            <label className="space-y-1 font-semibold">
              Active for sale
              <select
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                value={form.active ? "active" : "inactive"}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, active: event.target.value === "active" }))
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <button
              className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white"
              type="button"
              onClick={handleSubmit}
            >
              Save package
            </button>
            {error ? <div className="text-xs text-[var(--muted)]">{error}</div> : null}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <div>
            <p className="text-base font-semibold">Package list</p>
            <p className="text-sm text-[var(--muted)]">
              Packages available for fixed-development requests.
            </p>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-[var(--card)] text-[11px] uppercase tracking-wide text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 text-left">Package</th>
                  <th className="px-4 py-3 text-left">Billing</th>
                  <th className="px-4 py-3 text-left">Price</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr className="border-t border-[var(--border)]">
                    <td className="px-4 py-4 text-[var(--muted)]" colSpan={4}>
                      Loading packages...
                    </td>
                  </tr>
                ) : error ? (
                  <tr className="border-t border-[var(--border)]">
                    <td className="px-4 py-4 text-[var(--muted)]" colSpan={4}>
                      {error}
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr className="border-t border-[var(--border)]">
                    <td className="px-4 py-4 text-[var(--muted)]" colSpan={4}>
                      No packages yet. Create the first one.
                    </td>
                  </tr>
                ) : (
                  products.map((pkg) => (
                    <tr key={pkg.id} className="border-t border-[var(--border)]">
                      <td className="px-4 py-3">
                        <div className="font-semibold">{pkg.name}</div>
                        <div className="text-xs text-[var(--muted)]">{pkg.description}</div>
                      </td>
                      <td className="px-4 py-3">{pkg.billingCycle}</td>
                      <td className="px-4 py-3">${Number(pkg.unitPrice).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={pkg.active ? "ok" : "neutral"} size="sm">
                          {pkg.active ? "active" : "inactive"}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
