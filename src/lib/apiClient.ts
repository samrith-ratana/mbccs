export type ApiResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: string;
      fields?: string[];
      status?: number;
      traceId?: string;
    };

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function resolveToken() {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem("cc_access_token");
    if (stored) return stored;
    const cookieToken = readCookie("cc_access_token");
    if (cookieToken) return cookieToken;
  }
  return process.env.NEXT_PUBLIC_CORE_SYSTEM_TOKEN ?? "devtoken";
}

function resolveRole() {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem("cc_role");
    if (stored) return stored;
    const cookieRole = readCookie("cc_role");
    if (cookieRole) return cookieRole;
  }
  return process.env.NEXT_PUBLIC_CORE_SYSTEM_ROLE ?? "admin";
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { body?: unknown } = {}
): Promise<ApiResult<T>> {
  const { body, headers, ...rest } = options;
  const token = resolveToken();
  const role = resolveRole();
  const init: RequestInit = {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(role ? { "X-User-Role": role } : {}),
      ...(headers ?? {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  };

  try {
    const response = await fetch(path, init);
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        error: payload.error ?? "Request failed.",
        fields: payload.fields,
        status: response.status,
        traceId: payload.traceId,
      };
    }

    return { ok: true, data: payload.data as T };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Network error.",
      status: 0,
    };
  }
}
