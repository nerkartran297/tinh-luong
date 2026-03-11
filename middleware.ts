import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "auth_session";

function hasAuthCookie(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;
  const parts = cookieHeader.split(";").map((s) => s.trim());
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (name === COOKIE_NAME && value.length > 0) return true;
  }
  return false;
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (path.startsWith("/api/auth") || path === "/sign-in") {
    return NextResponse.next();
  }

  if (!hasAuthCookie(req.headers.get("cookie"))) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("from", path);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/employee", "/employee/:path*", "/employees"],
};
