"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import StatusBadge from "@/components/ui/StatusBadge";

type StatusState = {
  type: "idle" | "loading" | "success" | "error";
  message?: string;
  traceId?: string;
};

const SQL_PATTERN = /(--|;|\/\*|\*\/|\b(select|insert|update|delete|drop|alter|union|exec|truncate)\b|@@|\bchar\s*\(|\bnchar\s*\()/i;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hasSuspiciousInput(value: string) {
  return SQL_PATTERN.test(value);
}

function sanitizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<StatusState>({ type: "idle" });
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const [siteInfo, setSiteInfo] = useState({ host: "", site: "" });

  useEffect(() => {
    const host = window.location.host;
    const guess =
      host.includes("phnom") || host.startsWith("pp.")
        ? "phnom-penh"
        : host.includes("siem") || host.startsWith("sr.")
          ? "siem-reap"
          : host.includes("battambang") || host.startsWith("btb.")
            ? "battambang"
            : host.includes("localhost") || host.includes("127.0.0.1")
              ? "local"
              : "default";

    setSiteInfo({ host, site: guess });
  }, []);

  const siteLabel = siteInfo.site || "detecting";
  const hostLabel = siteInfo.host || "checking...";

  const validationError = useMemo(() => {
    const email = sanitizeEmail(form.email);
    const password = form.password;

    if (!email) return "Email is required.";
    if (!isValidEmail(email)) return "Enter a valid email address.";
    if (hasSuspiciousInput(email) || hasSuspiciousInput(password)) {
      return "Please remove unsafe characters from your credentials.";
    }
    if (!password) return "Password is required.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password.length > 128) return "Password is too long.";
    return null;
  }, [form.email, form.password]);

  const handleSubmit = async () => {
    if (validationError) {
      setStatus({ type: "error", message: validationError });
      return;
    }

    setStatus({ type: "loading", message: "Authenticating..." });

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: sanitizeEmail(form.email), password: form.password }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setStatus({
        type: "error",
        message: payload.error ?? "Authentication failed.",
        traceId: payload.traceId,
      });
      return;
    }

    const tokens = payload?.data?.tokens;
    if (tokens?.accessToken) {
      window.localStorage.setItem("cc_access_token", tokens.accessToken);
    }
    if (tokens?.refreshToken) {
      window.localStorage.setItem("cc_refresh_token", tokens.refreshToken);
    }
    const role = payload?.data?.user?.role ?? payload?.data?.role;
    if (role) {
      window.localStorage.setItem("cc_role", role);
    }

    const nextPath = searchParams.get("next") ?? "/";
    const safeNext = nextPath.startsWith("/") && !nextPath.startsWith("//")
      ? nextPath
      : "/";

    setStatus({
      type: "success",
      message: "Login successful.",
    });

    router.push(safeNext);
  };

  const isSubmitting = status.type === "loading";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-8 px-6 py-12">
      <header className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            MBCCS Secure Access
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--text)] md:text-4xl">
            Staff login for the MBCCS system.
          </h1>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Sign in to manage monitoring, billing, and subscriber operations with full
            audit coverage.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
            <div className="text-xs text-[var(--muted)]">Detected site</div>
            <div className="mt-1 text-lg font-semibold text-[var(--text)]">
              {siteLabel}
            </div>
            <div className="text-xs text-[var(--muted)]">{hostLabel}</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
            <div className="text-xs text-[var(--muted)]">Audit status</div>
            <div className="mt-1 text-lg font-semibold text-[var(--text)]">
              Monitoring active
            </div>
            <div className="text-xs text-[var(--muted)]">
              All staff actions logged.
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-[var(--text)]">Access checklist</p>
              <p className="text-sm text-[var(--muted)]">
                Make sure you are using approved MBCCS credentials.
              </p>
            </div>
            <StatusBadge tone="neutral">Policy</StatusBadge>
          </div>
          <div className="mt-4 grid gap-3 text-sm text-[var(--muted)]">
            <div className="rounded-xl border border-[var(--border)] bg-white px-4 py-3">
              Use your assigned staff email and password.
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-white px-4 py-3">
              Access attempts are reviewed for security compliance.
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-white px-4 py-3">
              Contact IT support if your access is blocked.
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                Staff login
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--text)]">
                Verify your MBCCS credentials
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Use your assigned staff email and password to continue.
              </p>
            </div>
            <StatusBadge tone="ok">Protected</StatusBadge>
          </div>

          <div className="mt-6 grid gap-4 text-sm">
            <label className="space-y-1 font-semibold">
              Email
              <input
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                type="email"
                placeholder="staff@mbccs.gov"
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
              />
            </label>
            <label className="space-y-1 font-semibold">
              Password
              <div className="flex items-center gap-2">
                <input
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                />
                <button
                  className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--muted)]"
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
              <span>Access attempts are logged for compliance.</span>
              <span>Need help? Contact IT.</span>
            </div>

            <button
              className="rounded-full bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white shadow-[var(--shadow)]"
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Authenticating..." : "Enter MBCCS"}
            </button>
            {validationError && status.type === "idle" ? (
              <p className="text-xs text-[var(--muted)]">{validationError}</p>
            ) : null}
          </div>

          {status.type !== "idle" ? (
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
              <StatusBadge tone={status.type === "error" ? "danger" : "ok"}>
                {status.type}
              </StatusBadge>
              <span>{status.message}</span>
              {status.traceId ? (
                <span className="text-[var(--muted)]">Trace: {status.traceId}</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

