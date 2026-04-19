import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATH_PREFIXES = [
  "/login",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
];

type UserRole = "admin" | "staff";

const ROLE_RULES: Array<{ prefix: string; roles: UserRole[] }> = [
  { prefix: "/settings", roles: ["admin"] },
  { prefix: "/corporate-team-management", roles: ["admin"] },
  { prefix: "/services-packages-management", roles: ["admin"] },
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

function resolveRole(request: NextRequest): UserRole {
  const roleCookie = request.cookies.get("cc_role")?.value as UserRole | undefined;
  const envRole = (process.env.CORE_SYSTEM_ROLE ?? "admin") as UserRole;
  return roleCookie ?? envRole;
}

function getRequiredRoles(pathname: string): UserRole[] | null {
  const rule = ROLE_RULES.find((entry) => pathname.startsWith(entry.prefix));
  return rule?.roles ?? null;
}

function hasSession(request: NextRequest) {
  const access = request.cookies.get("cc_access_token")?.value;
  const refresh = request.cookies.get("cc_refresh_token")?.value;
  return Boolean(access || refresh);
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!hasSession(request)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  const requiredRoles = getRequiredRoles(pathname);
  if (requiredRoles) {
    const role = resolveRole(request);
    if (!requiredRoles.includes(role)) {
      const forbiddenUrl = request.nextUrl.clone();
      forbiddenUrl.pathname = "/";
      forbiddenUrl.searchParams.set("denied", "1");
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
