import type { UserRole } from "@/models/user";

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return atob(padded);
}

function readRoleFromToken(token: string) {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(decodeBase64Url(parts[1]));
    if (payload && typeof payload.role === "string") {
      return payload.role as UserRole;
    }
  } catch {
    return null;
  }
  return null;
}

export function getClientRole() {
  if (typeof window === "undefined") return null;

  const stored = window.localStorage.getItem("cc_role");
  if (stored) return stored as UserRole;

  const cookieRole = readCookie("cc_role");
  if (cookieRole) return cookieRole as UserRole;

  const token = window.localStorage.getItem("cc_access_token");
  if (token) {
    const tokenRole = readRoleFromToken(token);
    if (tokenRole) return tokenRole;
  }

  return null;
}
