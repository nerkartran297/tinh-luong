import { NextRequest } from "next/server";
import { jsonResponse } from "@/src/lib/api";
import {
  verifySessionToken,
  getSessionFromCookie,
  getCookieName,
} from "@/src/lib/auth";

/** GET /api/auth/session - returns { signedIn: boolean } */
export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie");
    const token = getSessionFromCookie(cookieHeader);
    const signedIn = !!token && verifySessionToken(token);
    return jsonResponse({ signedIn });
  } catch {
    return jsonResponse({ signedIn: false });
  }
}
