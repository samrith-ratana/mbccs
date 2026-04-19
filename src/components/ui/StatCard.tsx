import StatusBadge from "./StatusBadge";

export default function StatCard({
  label,
  value,
  tone,
  badge,
}: {
  label: string;
  value: string;
  tone: "ok" | "warn" | "danger" | "neutral";
  badge: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow)]">
      <StatusBadge tone={tone}>{badge}</StatusBadge>
      <div className="mt-3 text-2xl font-semibold text-[var(--text)]">
        {value}
      </div>
      <div className="text-sm text-[var(--muted)]">{label}</div>
    </div>
  );
}
