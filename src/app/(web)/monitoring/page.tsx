"use client";

import { useEffect, useMemo, useState } from "react";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { apiFetch } from "@/lib/apiClient";
import { getClientRole } from "@/lib/authClient";
import type { ActivityLog } from "@/models/activity";
import type { UserRole } from "@/models/user";

const actionLabels: Record<ActivityLog["action"], string> = {
  login: "Login",
  logout: "Logout",
  failed_login: "Failed login",
  create: "Create",
  update: "Update",
  delete: "Delete",
};

const actionTones: Record<ActivityLog["action"], "ok" | "warn" | "danger" | "neutral"> =
  {
    login: "ok",
    logout: "neutral",
    failed_login: "danger",
    create: "ok",
    update: "warn",
    delete: "danger",
  };

function formatTimestamp(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function MonitoringPage() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [records, setRecords] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<ActivityLog["action"] | "all">("all");
  const [entityFilter, setEntityFilter] = useState<string | "all">("all");

  useEffect(() => {
    setRole(getClientRole());
  }, []);

  const loadActivity = async () => {
    setIsLoading(true);
    setError(null);
    const result = await apiFetch<ActivityLog[]>("/api/monitoring/activities?limit=250");
    if (!result.ok) {
      setError(result.error ?? "Unable to load activity logs.");
      setIsLoading(false);
      return;
    }
    setRecords(result.data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadActivity();
  }, []);

  const availableActions = useMemo<ActivityLog["action"][]>(() => {
    const values = new Set(records.map((entry) => entry.action));
    return Array.from(values) as ActivityLog["action"][];
  }, [records]);

  const availableEntities = useMemo<string[]>(() => {
    const values = new Set(records.map((entry) => entry.entity).filter(Boolean));
    return Array.from(values) as string[];
  }, [records]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return records.filter((entry) => {
      if (actionFilter !== "all" && entry.action !== actionFilter) {
        return false;
      }
      if (entityFilter !== "all" && entry.entity !== entityFilter) {
        return false;
      }
      if (!search) return true;
      return (
        entry.userId.toLowerCase().includes(search) ||
        (entry.summary ?? "").toLowerCase().includes(search) ||
        (entry.entity ?? "").toLowerCase().includes(search) ||
        (entry.entityId ?? "").toLowerCase().includes(search)
      );
    });
  }, [records, actionFilter, entityFilter, query]);

  const stats = useMemo(() => {
    const now = Date.now();
    const last24h = records.filter((entry) => {
      const time = new Date(entry.createdAt).getTime();
      return Number.isFinite(time) && now - time <= 1000 * 60 * 60 * 24;
    });
    const uniqueStaff = new Set(records.map((entry) => entry.userId)).size;
    return {
      total: records.length,
      last24h: last24h.length,
      uniqueStaff,
    };
  }, [records]);

  if (role === null) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
        <StatusBadge tone="neutral">Checking</StatusBadge>
        <p className="mt-3 text-sm text-[var(--muted)]">Verifying access...</p>
      </section>
    );
  }

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--text)]">Monitoring</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Track staff actions across key records for cyber audit readiness.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--muted)]"
            type="button"
            onClick={loadActivity}
          >
            Refresh
          </button>
        </div>
      </header>

      {role !== "admin" ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 text-sm text-[var(--muted)]">
          You can review your own activity. Admins can view the full staff audit log.
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow)]">
          <StatusBadge tone="ok">Total</StatusBadge>
          <div className="mt-3 text-2xl font-semibold">{stats.total}</div>
          <div className="text-sm text-[var(--muted)]">Logged events</div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow)]">
          <StatusBadge tone="warn">Last 24h</StatusBadge>
          <div className="mt-3 text-2xl font-semibold">{stats.last24h}</div>
          <div className="text-sm text-[var(--muted)]">Recent actions</div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow)]">
          <StatusBadge tone="neutral">Coverage</StatusBadge>
          <div className="mt-3 text-2xl font-semibold">{stats.uniqueStaff}</div>
          <div className="text-sm text-[var(--muted)]">Active staff</div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_1fr]">
          <label className="space-y-1 text-xs font-semibold text-[var(--muted)]">
            Search
            <input
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
              placeholder="Search staff, summary, entity..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="space-y-1 text-xs font-semibold text-[var(--muted)]">
            Action
            <select
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value)}
            >
              <option value="all">All actions</option>
              {availableActions.map((action) => (
                <option key={action} value={action}>
                  {actionLabels[action]}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs font-semibold text-[var(--muted)]">
            Entity
            <select
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
              value={entityFilter}
              onChange={(event) => setEntityFilter(event.target.value)}
            >
              <option value="all">All entities</option>
              {availableEntities.map((entity) => (
                <option key={entity} value={entity}>
                  {entity}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-base font-semibold">Audit timeline</p>
            <p className="text-sm text-[var(--muted)]">
              {isLoading
                ? "Loading events..."
                : error
                  ? "Unable to load logs."
                  : `${filtered.length} events shown`}
            </p>
          </div>
          <StatusBadge tone={error ? "danger" : "neutral"}>
            {error ? "Error" : "Live"}
          </StatusBadge>
        </div>

        <div className="mt-4">
          <DataTable
            rows={filtered}
            emptyMessage={isLoading ? "Loading activity..." : "No activity yet."}
            getRowKey={(row) => String(row.id)}
            columns={[
              {
                key: "createdAt",
                label: "Time",
                width: "160px",
                render: (row) => (
                  <div className="text-xs text-[var(--muted)]">
                    {formatTimestamp(row.createdAt)}
                  </div>
                ),
              },
              {
                key: "userId",
                label: "Staff",
                width: "180px",
                render: (row) => (
                  <div>
                    <div className="font-semibold text-[var(--text)]">
                      {row.userId}
                    </div>
                    <div className="text-xs text-[var(--muted)]">{row.role}</div>
                  </div>
                ),
              },
              {
                key: "action",
                label: "Action",
                width: "140px",
                render: (row) => (
                  <StatusBadge tone={actionTones[row.action]}>
                    {actionLabels[row.action]}
                  </StatusBadge>
                ),
              },
              {
                key: "entity",
                label: "Entity",
                width: "140px",
                render: (row) => row.entity ?? "-",
              },
              {
                key: "entityId",
                label: "Record",
                width: "160px",
                render: (row) => row.entityId ?? "-",
              },
              {
                key: "summary",
                label: "Summary",
                render: (row) => row.summary ?? "-",
              },
            ]}
          />
        </div>
      </section>
    </>
  );
}
