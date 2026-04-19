"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import { apiFetch } from "@/lib/apiClient";
import { getClientRole } from "@/lib/authClient";
import {
  ENTITY_LIST,
  type EntityDefinition,
  type EntityField,
} from "@/lib/fixedDevelopmentConfig";
import type { UserRole } from "@/models/user";

type DataRecord = Record<string, unknown>;

type FormState = Record<string, unknown>;

function buildEmptyForm(definition: EntityDefinition): FormState {
  const next: FormState = {};
  definition.fields.forEach((field) => {
    if (field.system) return;
    if (field.defaultValue !== undefined) {
      if (field.type === "json" && typeof field.defaultValue !== "string") {
        next[field.key] = JSON.stringify(field.defaultValue, null, 2);
      } else {
        next[field.key] = field.defaultValue;
      }
      return;
    }
    if (field.type === "boolean") {
      next[field.key] = false;
      return;
    }
    if (field.type === "select" && field.options && field.options.length > 0) {
      next[field.key] = field.options[0];
      return;
    }
    next[field.key] = "";
  });
  return next;
}

function toFormValue(field: EntityField, value: unknown) {
  if (value === null || value === undefined) {
    if (field.type === "boolean") return false;
    return "";
  }
  if (field.type === "json") {
    return typeof value === "string" ? value : JSON.stringify(value, null, 2);
  }
  if (field.type === "boolean") return Boolean(value);
  return value;
}

function formatCell(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    const raw = JSON.stringify(value);
    return raw.length > 60 ? `${raw.slice(0, 60)}…` : raw;
  }
  const text = String(value);
  return text.length > 60 ? `${text.slice(0, 60)}…` : text;
}

export default function ServicesPackagesManagementPage() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [entityKey, setEntityKey] = useState<EntityDefinition["key"]>(
    ENTITY_LIST[0]?.key ?? "products"
  );
  const [records, setRecords] = useState<DataRecord[]>([]);
  const [form, setForm] = useState<FormState>(() =>
    ENTITY_LIST[0] ? buildEmptyForm(ENTITY_LIST[0]) : {}
  );
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRole(getClientRole());
  }, []);

  const canEdit = role === "admin";

  const definition = useMemo(
    () => ENTITY_LIST.find((item) => item.key === entityKey),
    [entityKey]
  );

  const visibleColumns = useMemo(() => {
    if (!definition) return [];
    const base = definition.fields.filter((field) => field.showInTable);
    return base.length > 6 ? base.slice(0, 6) : base;
  }, [definition]);

  const loadRecords = async () => {
    if (!definition) return;
    setIsLoading(true);
    setError(null);
    const result = await apiFetch<DataRecord[]>(`/api/fixed-development/${definition.key}`);
    if (!result.ok) {
      setError(result.error ?? "Unable to load records.");
      setIsLoading(false);
      return;
    }
    setRecords(result.data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!definition) return;
    setForm(buildEmptyForm(definition));
    setSelectedId(null);
    setMode("create");
    loadRecords();
  }, [definition]);

  const handleSelectRecord = (record: DataRecord) => {
    if (!definition) return;
    const idValue = record[definition.idField] as string | number | undefined;
    setSelectedId(idValue ?? null);
    const nextForm: FormState = {};
    definition.fields.forEach((field) => {
      if (field.system) return;
      nextForm[field.key] = toFormValue(field, record[field.key]);
    });
    setForm(nextForm);
    setMode("edit");
  };

  const handleCancelEdit = () => {
    if (!definition) return;
    setForm(buildEmptyForm(definition));
    setSelectedId(null);
    setMode("create");
  };

  const validateAndBuildPayload = () => {
    if (!definition) return { ok: false as const, message: "No entity selected." };
    const payload: Record<string, unknown> = {};
    for (const field of definition.fields) {
      if (field.system) continue;
      let raw = form[field.key];

      if (typeof raw === "string") {
        raw = raw.trim();
      }

      if (field.required && (raw === "" || raw === null || raw === undefined)) {
        return { ok: false as const, message: `${field.label} is required.` };
      }

      if (field.type === "number") {
        if (raw === "" || raw === null || raw === undefined) {
          continue;
        }
        const numeric = Number(raw);
        if (!Number.isFinite(numeric)) {
          return { ok: false as const, message: `${field.label} must be a number.` };
        }
        payload[field.key] = numeric;
        continue;
      }

      if (field.type === "boolean") {
        payload[field.key] = Boolean(raw);
        continue;
      }

      if (field.type === "json") {
        if (raw === "" || raw === null || raw === undefined) {
          continue;
        }
        payload[field.key] = raw;
        continue;
      }

      payload[field.key] = raw === "" ? undefined : raw;
    }

    return { ok: true as const, payload };
  };

  const handleCreate = async () => {
    if (!canEdit) {
      setError("Only admins can create records.");
      return;
    }
    if (!definition) return;
    const result = validateAndBuildPayload();
    if (!result.ok) {
      setError(result.message);
      return;
    }

    setError(null);
    const response = await apiFetch<DataRecord>(`/api/fixed-development/${definition.key}`, {
      method: "POST",
      body: result.payload,
    });

    if (!response.ok) {
      setError(response.error ?? "Unable to create record.");
      return;
    }

    setForm(buildEmptyForm(definition));
    loadRecords();
  };

  const handleUpdate = async () => {
    if (!canEdit) {
      setError("Only admins can update records.");
      return;
    }
    if (!definition || selectedId === null) return;
    const result = validateAndBuildPayload();
    if (!result.ok) {
      setError(result.message);
      return;
    }

    setError(null);
    const response = await apiFetch<DataRecord>(
      `/api/fixed-development/${definition.key}/${selectedId}`,
      {
        method: "PATCH",
        body: result.payload,
      }
    );

    if (!response.ok) {
      setError(response.error ?? "Unable to update record.");
      return;
    }

    handleCancelEdit();
    loadRecords();
  };

  const handleDelete = async (record: DataRecord) => {
    if (!canEdit) {
      setError("Only admins can delete records.");
      return;
    }
    if (!definition) return;
    const idValue = record[definition.idField] as string | number | undefined;
    if (idValue === undefined) return;
    if (!window.confirm(`Delete ${definition.label} ${idValue}?`)) return;

    const response = await apiFetch<DataRecord>(
      `/api/fixed-development/${definition.key}/${idValue}`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      setError(response.error ?? "Unable to delete record.");
      return;
    }

    if (selectedId === idValue) {
      handleCancelEdit();
    }
    loadRecords();
  };

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--text)]">
            Services packages management
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Admin panel for CRUD across all Oracle tables.
          </p>
        </div>
        <StatusBadge tone={records.length === 0 ? "neutral" : "ok"}>
          {isLoading ? "Loading" : `${records.length} records`}
        </StatusBadge>
      </header>

      {!canEdit ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 text-sm text-[var(--muted)]">
          View-only mode. Only admins can create, update, or delete records.
        </div>
      ) : null}

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
        <div className="grid gap-3 lg:grid-cols-[1.3fr_2fr]">
          <label className="space-y-1 text-xs font-semibold text-[var(--muted)]">
            Table
            <select
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
              value={entityKey}
              onChange={(event) =>
                setEntityKey(event.target.value as EntityDefinition["key"])
              }
            >
              {ENTITY_LIST.map((entity) => (
                <option key={entity.key} value={entity.key}>
                  {entity.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
            {definition ? definition.description : "Select a table to manage data."}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_2fr]">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold">
                {mode === "edit" ? "Edit record" : "Create record"}
              </p>
              <p className="text-sm text-[var(--muted)]">
                {definition?.label ?? "Select a table"} fields.
              </p>
            </div>
            {mode === "edit" ? (
              <button
                className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--muted)]"
                type="button"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 text-sm">
            {definition?.fields
              .filter((field) => !field.system)
              .map((field) => {
                const value = form[field.key];
                const safeValue =
                  typeof value === "string" || typeof value === "number" ? value : "";
                const commonProps = {
                  className:
                    "w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm",
                  value: field.type === "boolean" ? undefined : safeValue,
                  onChange: (
                    event: ChangeEvent<
                      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                    >
                  ) => {
                    const nextValue =
                      field.type === "boolean"
                        ? (event.target as HTMLInputElement).checked
                        : event.target.value;
                    setForm((prev) => ({ ...prev, [field.key]: nextValue }));
                  },
                  disabled: !canEdit,
                };

                if (field.type === "textarea" || field.type === "json") {
                  return (
                    <label key={field.key} className="space-y-1 font-semibold">
                      {field.label}
                      <textarea
                        {...commonProps}
                        className={`${commonProps.className} min-h-[110px]`}
                        placeholder={field.placeholder}
                      />
                    </label>
                  );
                }

                if (field.type === "select") {
                  return (
                    <label key={field.key} className="space-y-1 font-semibold">
                      {field.label}
                      <select {...commonProps}>
                        {(field.options ?? []).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                }

                if (field.type === "boolean") {
                  return (
                    <label key={field.key} className="flex items-center gap-3 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, [field.key]: event.target.checked }))
                        }
                        disabled={!canEdit}
                      />
                      {field.label}
                    </label>
                  );
                }

                return (
                  <label key={field.key} className="space-y-1 font-semibold">
                    {field.label}
                    <input
                      {...commonProps}
                      type={field.type === "number" ? "number" : field.type === "email" ? "email" : field.type === "date" ? "date" : "text"}
                      placeholder={field.placeholder}
                    />
                  </label>
                );
              })}

            {error ? <div className="text-xs text-[var(--muted)]">{error}</div> : null}

            <div className="flex flex-wrap gap-2">
              {mode === "edit" ? (
                <button
                  className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white"
                  type="button"
                  onClick={handleUpdate}
                  disabled={!canEdit}
                >
                  Update
                </button>
              ) : (
                <button
                  className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white"
                  type="button"
                  onClick={handleCreate}
                  disabled={!canEdit}
                >
                  Create
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold">Records</p>
              <p className="text-sm text-[var(--muted)]">
                Click a row to edit. Use actions to delete.
              </p>
            </div>
            {definition ? (
              <StatusBadge tone="neutral">{definition.label}</StatusBadge>
            ) : null}
          </div>
          <div className="mt-4 overflow-auto rounded-2xl border border-[var(--border)] bg-white">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-[var(--card)] text-[11px] uppercase tracking-wide text-[var(--muted)]">
                <tr>
                  {visibleColumns.map((column) => (
                    <th key={column.key} className="px-4 py-3 text-left">
                      {column.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr className="border-t border-[var(--border)]">
                    <td className="px-4 py-4 text-[var(--muted)]" colSpan={visibleColumns.length + 1}>
                      Loading records...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr className="border-t border-[var(--border)]">
                    <td className="px-4 py-4 text-[var(--muted)]" colSpan={visibleColumns.length + 1}>
                      No records found.
                    </td>
                  </tr>
                ) : (
                  records.map((record, index) => {
                    const rowKey =
                      (definition?.idField && record[definition.idField]) ??
                      `row-${index}`;
                    return (
                      <tr
                        key={String(rowKey)}
                        className="border-t border-[var(--border)] hover:bg-[var(--card)]"
                        onClick={() => handleSelectRecord(record)}
                      >
                        {visibleColumns.map((column) => (
                          <td key={column.key} className="px-4 py-3">
                            {formatCell(record[column.key])}
                          </td>
                        ))}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--muted)]"
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleSelectRecord(record);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--muted)]"
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDelete(record);
                              }}
                              disabled={!canEdit}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
