"use client";

import { useState, type FormEvent } from "react";

type SearchFieldProps = {
  placeholder?: string;
  size?: "sm" | "md";
  actionLabel?: string;
  onSubmit?: (query: string) => void;
};

export default function SearchField({
  placeholder = "Search...",
  size = "md",
  actionLabel,
  onSubmit,
}: SearchFieldProps) {
  const [query, setQuery] = useState("");
  const isCompact = size === "sm";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit?.(query.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <span
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
      >
        <svg
          viewBox="0 0 24 24"
          className={isCompact ? "h-4 w-4" : "h-5 w-5"}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </span>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        name="q"
        type="search"
        placeholder={placeholder}
        aria-label={placeholder}
        className={`w-full rounded-full border border-[var(--border)] bg-white pl-9 ${
          actionLabel ? "pr-24" : "pr-4"
        } font-semibold text-[var(--text)] shadow-[var(--shadow)] placeholder:text-[var(--muted)] ${
          isCompact ? "py-2 text-xs" : "py-3 text-sm"
        }`}
      />
      {actionLabel ? (
        <button
          type="submit"
          className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-[var(--primary)] px-3 py-1 text-xs font-semibold text-white ${
            isCompact ? "text-[10px]" : "text-xs"
          }`}
        >
          {actionLabel}
        </button>
      ) : null}
    </form>
  );
}
