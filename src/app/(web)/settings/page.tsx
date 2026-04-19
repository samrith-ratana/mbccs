"use client";

import { useEffect, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import { getClientRole } from "@/lib/authClient";
import type { UserRole } from "@/models/user";

export default function SettingsPage() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRole(getClientRole());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
        <StatusBadge tone="neutral">Checking</StatusBadge>
        <p className="mt-3 text-sm text-[var(--muted)]">Verifying access...</p>
      </section>
    );
  }

  if (role !== "admin") {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
        <StatusBadge tone="danger">Restricted</StatusBadge>
        <h1 className="mt-3 text-2xl font-semibold text-[var(--text)]">
          Settings access is limited
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Only the admin account can manage system settings. If you need access, ask an
          admin to review your permissions.
        </p>
      </section>
    );
  }

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--text)]">Settings</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Configure security, notifications, and workflow defaults.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--muted)]"
            type="button"
          >
            Reset defaults
          </button>
          <button
            className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow)]"
            type="button"
          >
            Save settings
          </button>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold">Security controls</p>
              <p className="text-sm text-[var(--muted)]">
                Protect customer data and access scope.
              </p>
            </div>
            <StatusBadge tone="ok">Enabled</StatusBadge>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <label className="flex items-center justify-between gap-3">
              <span>Require MFA for staff</span>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span>Auto-rotate API keys</span>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span>Restrict exports to admins</span>
              <input type="checkbox" className="h-4 w-4" />
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold">Notifications</p>
              <p className="text-sm text-[var(--muted)]">
                Configure service alerts and escalation paths.
              </p>
            </div>
            <StatusBadge tone="neutral">Standard</StatusBadge>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <label className="flex items-center justify-between gap-3">
              <span>Deployment status updates</span>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span>Service outage alerts</span>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span>Weekly executive summary</span>
              <input type="checkbox" className="h-4 w-4" />
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-base font-semibold">Workflow defaults</p>
            <p className="text-sm text-[var(--muted)]">
              Set baseline durations for new customer onboarding.
            </p>
          </div>
          <button
            className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--muted)]"
            type="button"
          >
            Apply to all
          </button>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <label className="space-y-1 text-sm font-semibold">
            Intake review window
            <input
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
              defaultValue="48 hours"
            />
          </label>
          <label className="space-y-1 text-sm font-semibold">
            Deployment readiness
            <input
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
              defaultValue="5 days"
            />
          </label>
          <label className="space-y-1 text-sm font-semibold">
            Renewal reminders
            <input
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
              defaultValue="60 days"
            />
          </label>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold">Site controls</p>
              <p className="text-sm text-[var(--muted)]">
                Keep the console stable during changes.
              </p>
            </div>
            <StatusBadge tone="warn">Review</StatusBadge>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <label className="flex items-center justify-between gap-3">
              <span>Maintenance mode</span>
              <input type="checkbox" className="h-4 w-4" />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span>Automatic nightly backups</span>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span>Enable audit logging</span>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold">Data policies</p>
              <p className="text-sm text-[var(--muted)]">
                Defaults for storage and exports.
              </p>
            </div>
            <StatusBadge tone="ok">Aligned</StatusBadge>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <label className="space-y-1 font-semibold">
              Default retention
              <select className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm">
                <option>30 days</option>
                <option>90 days</option>
                <option>180 days</option>
              </select>
            </label>
            <label className="space-y-1 font-semibold">
              Export cadence
              <select className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm">
                <option>Weekly</option>
                <option>Monthly</option>
                <option>Quarterly</option>
              </select>
            </label>
            <label className="space-y-1 font-semibold">
              Default timezone
              <select className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm">
                <option>Asia/Phnom_Penh</option>
                <option>Asia/Bangkok</option>
                <option>UTC</option>
              </select>
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold">Quick actions</p>
              <p className="text-sm text-[var(--muted)]">
                Shortcuts for site management tasks.
              </p>
            </div>
            <StatusBadge tone="neutral">Ready</StatusBadge>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <button
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--muted)]"
              type="button"
            >
              Run access review
            </button>
            <button
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--muted)]"
              type="button"
            >
              Generate backup snapshot
            </button>
            <button
              className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow)]"
              type="button"
            >
              Sync billing rules
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
