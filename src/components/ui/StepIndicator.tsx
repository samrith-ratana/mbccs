export default function StepIndicator({
  steps,
  current,
  size = "md",
}: {
  steps: string[];
  current: number;
  size?: "sm" | "md";
}) {
  const isCompact = size === "sm";
  return (
    <div className="flex flex-wrap gap-2" role="list" aria-label="Workflow steps">
      {steps.map((step, index) => {
        const isActive = index === current;
        const isComplete = index < current;
        const state = isComplete ? "complete" : isActive ? "active" : "upcoming";
        return (
          <div
            key={step}
            data-state={state}
            role="listitem"
            className={`flex items-center gap-2 rounded-full border font-semibold ${
              isCompact ? "px-2 py-1 text-[10px]" : "px-3 py-1 text-xs"
            } ${
              isComplete || isActive
                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                : "border-[var(--border)] bg-white text-[var(--muted)]"
            }`}
          >
            <div
              className={`flex items-center justify-center rounded-full border font-semibold ${
                isCompact ? "h-5 w-5 text-[9px]" : "h-6 w-6 text-[10px]"
              } ${
                isComplete
                  ? "border-transparent bg-[var(--accent)] text-white"
                  : isActive
                    ? "border-[var(--accent)] bg-white text-[var(--accent)]"
                    : "border-[var(--border)] bg-white text-[var(--muted)]"
              }`}
              aria-current={isActive ? "step" : undefined}
            >
              {isComplete ? "OK" : index + 1}
            </div>
            <span>{step}</span>
          </div>
        );
      })}
    </div>
  );
}
