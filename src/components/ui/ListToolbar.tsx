"use client";

import type { ReactNode } from "react";
import SearchField from "./SearchField";
import StatusBadge, { type Tone } from "./StatusBadge";

type FilterChip = {
  label: string;
  tone?: Tone;
};

type ListToolbarProps = {
  title: string;
  description?: string;
  countLabel?: string;
  filters?: FilterChip[];
  actions?: ReactNode;
  searchPlaceholder?: string;
};

const filterToneStyles: Record<Tone, string> = {
  ok: "border-[var(--ok)] bg-[var(--ok-soft)] text-[var(--ok)]",
  warn: "border-[var(--warn)] bg-[var(--warn-soft)] text-[var(--warn)]",
  danger: "border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--danger)]",
  neutral: "border-[var(--border)] bg-white text-[var(--muted)]",
};

export default function ListToolbar({
  title,
  description,
  countLabel,
  filters = [],
  actions,
  searchPlaceholder = "Search records...",
}: ListToolbarProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold">{title}</p>
          {description ? (
            <p className="text-sm text-[var(--muted)]">{description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {countLabel ? (
            <StatusBadge tone="neutral" size="sm">
              {countLabel}
            </StatusBadge>
          ) : null}
          {actions}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[220px] flex-1">
          <SearchField size="sm" actionLabel="Search" placeholder={searchPlaceholder} />
        </div>
        {filters.map((filter) => (
          <button
            key={filter.label}
            type="button"
            className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${
              filterToneStyles[filter.tone ?? "neutral"]
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}
