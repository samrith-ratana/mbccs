"use client";

import type { ReactNode } from "react";

type Column<T> = {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  width?: string;
  render?: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  emptyMessage?: string;
  getRowKey?: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
};

const alignmentClasses = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

export default function DataTable<T>({
  columns,
  rows,
  emptyMessage = "No records found.",
  getRowKey,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-[var(--card)] text-[11px] uppercase tracking-wide text-[var(--muted)]">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={column.width ? { width: column.width } : undefined}
                className={`px-4 py-3 ${
                  alignmentClasses[column.align ?? "left"]
                }`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr className="border-t border-[var(--border)]">
              <td
                className="px-4 py-4 text-[var(--muted)]"
                colSpan={columns.length}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => {
              const rowKey = getRowKey?.(row, index) ?? String(index);
              return (
                <tr
                  key={rowKey}
                  className={`border-t border-[var(--border)] ${
                    onRowClick ? "cursor-pointer hover:bg-[var(--card)]" : ""
                  }`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => {
                    const value = column.render
                      ? column.render(row)
                      : (row as Record<string, ReactNode>)[column.key];
                    return (
                      <td
                        key={column.key}
                        className={`px-4 py-3 ${
                          alignmentClasses[column.align ?? "left"]
                        }`}
                      >
                        {value ?? (
                          <span className="text-[var(--muted)]">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
