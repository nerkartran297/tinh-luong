import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "auth_session";
const SESSION_PAYLOAD = "admin_session";

function getPassword(): string {
  const p = process.env.ADMIN_PASSWORD;
  if (!p) throw new Error("ADMIN_PASSWORD is not set");
  return p;
}

function getAccount(): string {
  return (
    process.env.ADMIN_ACCOUNT ||
    process.env.ADMIN_ACOUNT ||
    ""
  );
}

export function getAuthAccount(): string {
  return getAccount();
}

function sign(payload: string): string {
  return createHmac("sha256", getPassword()).update(payload).digest("hex");
}

export function createSessionToken(): string {
  return sign(SESSION_PAYLOAD);
}

export function verifySessionToken(token: string): boolean {
  try {
    const expected = createSessionToken();
    if (token.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(token, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export function getCookieName(): string {
  return COOKIE_NAME;
}

export function getSessionFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((s) => s.trim());
  for (const part of parts) {
    const [name, value] = part.split("=");
    if (name?.trim() === COOKIE_NAME && value) {
      return decodeURIComponent(value);
    }
  }
  return null;
}
