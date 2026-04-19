"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import { getClientRole } from "@/lib/authClient";
import type { UserRole } from "@/models/user";

type NavItem = {
  href: string;
  label: string;
  badge?: string;
  badgeTone?: "ok" | "warn" | "danger" | "neutral";
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    title: "Dashboard",
    items: [{ href: "/", label: "Home" }],
  },
  {
    title: "Registration",
    items: [
      { href: "/fixed-development", label: "Subscriber Onboarding" },
      { href: "/list-packages", label: "Cloud Packages" },
      { href: "/inventory-management", label: "Device Inventory" },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        href: "/invoice-management",
        label: "Invoices",
        badge: "Billing",
        badgeTone: "warn",
      },
      { href: "/payment-business", label: "Payments" },
      { href: "/statement-manager", label: "Billing Cycles" },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/monitoring", label: "Monitoring" },
      { href: "/services-packages", label: "Services Packages" },
      { href: "/reports", label: "Reports" },
      { href: "/import-export", label: "Import/Export" },
    ],
  },
  {
    title: "Admin",
    items: [
      { href: "/corporate-team-management", label: "Staff & Roles" },
      { href: "/data-management", label: "Data Admin" },
      { href: "/settings", label: "Settings" },
    ],
  },
];

export default function SideNav() {
  const pathname = usePathname();
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    setRole(getClientRole());
  }, []);

  const canAccessSettings = role === "admin";
  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.href === "/settings" ? canAccessSettings : true
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <nav className="flex flex-col gap-4">
      {visibleSections.map((section) => (
        <div key={section.title} className="flex flex-col gap-2">
          <div className="px-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--sidebar-muted)]">
            {section.title}
          </div>
          <div className="flex flex-wrap gap-2 lg:flex-col">
            {section.items.map((item) => {
              const isRoot = item.href === "/";
              const isActive = isRoot
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center justify-between rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "border-[var(--accent)] bg-[var(--sidebar-active)] text-[var(--accent)]"
                      : "border-transparent text-[var(--sidebar-muted)] hover:border-[var(--sidebar-border)] hover:bg-[var(--sidebar-surface)] hover:text-[var(--sidebar-text)]"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge ? (
                    <StatusBadge
                      tone={item.badgeTone ?? "neutral"}
                      size="sm"
                      className="uppercase"
                    >
                      {item.badge}
                    </StatusBadge>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      <div className="mt-7 rounded-2xl border border-[var(--sidebar-border)] bg-[var(--sidebar-surface)] p-4 text-xs text-[var(--sidebar-muted)]">
        <div>Signed in as</div>
        <strong className="text-sm text-[var(--sidebar-text)]">
          Staff Admin
        </strong>
        <div className="my-3 h-px bg-[var(--sidebar-border)]" />
        <div>Next review</div>
        <strong className="text-sm text-[var(--sidebar-text)]">
          Apr 2, 2026
        </strong>
      </div>

      <button
        className="mt-2 rounded-xl border border-[var(--sidebar-border)] bg-[var(--sidebar-surface)] px-4 py-2 text-sm font-semibold text-[var(--sidebar-text)] transition hover:bg-[var(--sidebar-active)]"
        type="button"
        onClick={async () => {
          try {
            await fetch("/api/auth/logout", { method: "POST" });
          } catch {
            // Ignore network errors; still clear local session.
          }
          if (typeof window !== "undefined") {
            window.localStorage.removeItem("cc_access_token");
            window.localStorage.removeItem("cc_refresh_token");
            window.localStorage.removeItem("cc_role");
            window.location.href = "/login";
          }
        }}
      >
        Logout
      </button>
    </nav>
  );
}
