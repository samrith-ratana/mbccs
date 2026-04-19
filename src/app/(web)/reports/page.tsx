import StatusBadge from "@/components/ui/StatusBadge";

export default function ReportsPage() {
  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--text)]">Reports</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            KPI trends, camera uptime, and billing performance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--muted)]"
            type="button"
          >
            Export PDF
          </button>
          <button
            className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow)]"
            type="button"
          >
            Generate report
          </button>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow)]">
          <StatusBadge tone="ok">Upward</StatusBadge>
          <div className="mt-3 text-2xl font-semibold">$84,120</div>
          <div className="text-sm text-[var(--muted)]">Monthly revenue</div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow)]">
          <StatusBadge tone="warn">Hold</StatusBadge>
          <div className="mt-3 text-2xl font-semibold">2.1%</div>
          <div className="text-sm text-[var(--muted)]">Late payments</div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow)]">
          <StatusBadge tone="ok">Strong</StatusBadge>
          <div className="mt-3 text-2xl font-semibold">34</div>
          <div className="text-sm text-[var(--muted)]">New camera installs</div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold">Onboarding conversion</p>
              <p className="text-sm text-[var(--muted)]">
                Stage-to-stage conversion rate this month.
              </p>
            </div>
            <StatusBadge tone="ok">+6%</StatusBadge>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <div className="flex items-center justify-between">
                <span>Customer to Camera setup</span>
                <span className="font-semibold">72%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-[var(--primary-soft)]">
                <div className="h-2 rounded-full bg-[var(--primary)]" style={{ width: "72%" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span>Camera setup to Contract</span>
                <span className="font-semibold">54%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-[var(--primary-soft)]">
                <div className="h-2 rounded-full bg-[var(--primary)]" style={{ width: "54%" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span>Contract to Activated</span>
                <span className="font-semibold">41%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-[var(--primary-soft)]">
                <div className="h-2 rounded-full bg-[var(--primary)]" style={{ width: "41%" }} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold">Package adoption</p>
              <p className="text-sm text-[var(--muted)]">
                Usage distribution by retention tier.
              </p>
            </div>
            <StatusBadge tone="neutral">Monthly</StatusBadge>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Basic</span>
              <span className="font-semibold">48%</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--primary-soft)]">
              <div className="h-2 rounded-full bg-[var(--primary)]" style={{ width: "48%" }} />
            </div>
            <div className="flex items-center justify-between">
              <span>Standard</span>
              <span className="font-semibold">32%</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--primary-soft)]">
              <div className="h-2 rounded-full bg-[var(--primary)]" style={{ width: "32%" }} />
            </div>
            <div className="flex items-center justify-between">
              <span>Premium</span>
              <span className="font-semibold">20%</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--primary-soft)]">
              <div className="h-2 rounded-full bg-[var(--primary)]" style={{ width: "20%" }} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

