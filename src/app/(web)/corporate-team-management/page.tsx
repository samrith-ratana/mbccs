"use client";

import { useEffect, useMemo, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import { apiFetch } from "@/lib/apiClient";

type StaffUser = {
  id: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt?: string;
};

type StatusState = {
  tone: "ok" | "warn" | "danger" | "neutral";
  message: string;
};

export default function CorporateTeamManagementPage() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<StatusState | null>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    apiFetch<StaffUser[]>("/api/auth/users").then((result) => {
      if (!active) return;
      if (!result.ok) {
        setStatus({ tone: "danger", message: result.error ?? "Unable to load staff." });
        setIsLoading(false);
        return;
      }
      setStaff(result.data);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const activeCount = useMemo(() => staff.filter((user) => user.active).length, [staff]);
  const adminCount = useMemo(
    () => staff.filter((user) => user.role === "admin").length,
    [staff]
  );

  const handleSubmit = async () => {
    setStatus({ tone: "neutral", message: "Creating staff account..." });

    const result = await apiFetch<StaffUser>("/api/auth/users", {
      method: "POST",
      body: {
        email: form.email,
        password: form.password,
      },
    });

    if (!result.ok) {
      setStatus({ tone: "danger", message: result.error ?? "Unable to create user." });
      return;
    }

    setStaff((prev) => [result.data, ...prev]);
    setForm({ email: "", password: "" });
    setStatus({ tone: "ok", message: "Staff account created." });
  };

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--text)]">
            Corporate team management
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Create staff accounts and manage roles for console access.
          </p>
        </div>
        <StatusBadge tone="neutral">Settings locked to admin</StatusBadge>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <StatusBadge tone="ok">Coverage</StatusBadge>
          <div className="mt-3 text-2xl font-semibold">{activeCount}</div>
          <div className="text-sm text-[var(--muted)]">Active team members</div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <StatusBadge tone="warn">Admins</StatusBadge>
          <div className="mt-3 text-2xl font-semibold">{adminCount}</div>
          <div className="text-sm text-[var(--muted)]">Admins (settings access)</div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <StatusBadge tone="neutral">Staff</StatusBadge>
          <div className="mt-3 text-2xl font-semibold">
            {staff.filter((user) => user.role === "staff").length}
          </div>
          <div className="text-sm text-[var(--muted)]">Operational staff accounts</div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <div>
            <p className="text-base font-semibold">Create staff account</p>
            <p className="text-sm text-[var(--muted)]">
              Staff can access all modules except Settings. Settings are reserved for admins.
            </p>
          </div>
          <div className="mt-4 grid gap-4 text-sm">
            <label className="space-y-1 font-semibold">
              Email
              <input
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                placeholder="staff@company.com"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
              />
            </label>
            <label className="space-y-1 font-semibold">
              Password
              <input
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                placeholder="Minimum 8 characters"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, password: event.target.value }))
                }
              />
            </label>
            <div className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm">
              <div className="text-xs font-semibold text-[var(--muted)]">Role</div>
              <div className="font-semibold">Staff (no settings)</div>
            </div>
            <button
              className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow)]"
              type="button"
              onClick={handleSubmit}
            >
              Create staff user
            </button>
          </div>
          {status ? (
            <div className="mt-4 flex items-center gap-2 text-xs">
              <StatusBadge tone={status.tone}>{status.tone}</StatusBadge>
              <span>{status.message}</span>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold">Team roster</p>
              <p className="text-sm text-[var(--muted)]">
                Active staff accounts with their assigned roles.
              </p>
            </div>
            <StatusBadge tone="neutral">{staff.length} members</StatusBadge>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-[var(--card)] text-[11px] uppercase tracking-wide text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr className="border-t border-[var(--border)]">
                    <td className="px-4 py-3 text-[var(--muted)]" colSpan={4}>
                      Loading staff...
                    </td>
                  </tr>
                ) : staff.length === 0 ? (
                  <tr className="border-t border-[var(--border)]">
                    <td className="px-4 py-3 text-[var(--muted)]" colSpan={4}>
                      No staff accounts yet.
                    </td>
                  </tr>
                ) : (
                  staff.map((member) => (
                    <tr key={member.id} className="border-t border-[var(--border)]">
                      <td className="px-4 py-3">
                        <div className="font-semibold">{member.email}</div>
                        <div className="text-xs text-[var(--muted)]">{member.id}</div>
                      </td>
                      <td className="px-4 py-3 capitalize">{member.role}</td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={member.active ? "ok" : "warn"} size="sm">
                          {member.active ? "Active" : "Inactive"}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--muted)]">
                        {member.createdAt
                          ? new Date(member.createdAt).toLocaleString()
                          : "-"}
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
