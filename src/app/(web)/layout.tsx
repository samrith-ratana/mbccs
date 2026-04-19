import SideNav from "@/components/layout/SideNav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
        <div className="grid min-h-screen grid-cols-1 bg-[var(--bg)] text-[var(--text)] lg:grid-cols-[270px_minmax(0,1fr)]">
          <aside className="sticky top-0 z-20 h-full max-h-screen self-start overflow-y-auto border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] p-6 text-[var(--sidebar-text)] lg:h-screen">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent)] text-sm font-bold uppercase tracking-[0.2em] text-white">
                MB
              </div>
              <div className="text-sm text-[var(--sidebar-muted)]">
                <strong className="block text-base text-[var(--sidebar-text)]">
                  Cloud Camera
                </strong>
                Subscriber Console
              </div>
            </div>
            <input
              className="mb-6 w-full rounded-xl border border-[var(--sidebar-border)] bg-[var(--sidebar-surface)] px-3 py-2 text-sm text-[var(--sidebar-text)] outline-none placeholder:text-[var(--sidebar-muted)]"
              placeholder="Search..."
              type="search"
            />
            <SideNav />
          </aside>
          <main className="p-6 lg:p-8">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
              {children}
            </div>
          </main>
        </div>
  );
}

