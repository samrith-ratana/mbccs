import type { ReactNode } from "react";

const toneStyles = {
  ok: "bg-[var(--ok-soft)] text-[var(--ok)]",
  warn: "bg-[var(--warn-soft)] text-[var(--warn)]",
  danger: "bg-[var(--danger-soft)] text-[var(--danger)]",
  neutral: "bg-[var(--primary-soft)] text-[var(--primary)]",
} as const;

const sizeStyles = {
  sm: "px-2.5 py-0.5 text-[10px]",
  md: "px-3 py-1 text-[11px]",
} as const;

export type Tone = keyof typeof toneStyles;
type Size = keyof typeof sizeStyles;

export default function StatusBadge({
  tone = "neutral",
  size = "md",
  className = "",
  children,
}: {
  tone?: Tone;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold uppercase tracking-wide ${
        sizeStyles[size]
      } ${toneStyles[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
