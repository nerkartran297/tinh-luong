import { NextRequest } from "next/server";
import { jsonResponse, errorResponse } from "@/src/lib/api";
import {
  getAuthAccount,
  createSessionToken,
  getCookieName,
  verifySessionToken,
  getSessionFromCookie,
} from "@/src/lib/auth";

const SAME_SITE = "Strict";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/** POST /api/auth/sign-in - body { username, password } */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    const account = getAuthAccount();
    if (!account) {
      return errorResponse("Server auth not configured", 500);
    }
    if (username !== account || password !== process.env.ADMIN_PASSWORD) {
      return errorResponse("Tên đăng nhập hoặc mật khẩu không đúng", 401);
    }

    const token = createSessionToken();
    const cookieValue = encodeURIComponent(token);
    const cookie = `${getCookieName()}=${cookieValue}; Path=/; HttpOnly; SameSite=${SAME_SITE}; Max-Age=${MAX_AGE}`;

    return new Response(
      JSON.stringify({ success: true, data: { signedIn: true } }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": cookie,
        },
      }
    );
  } catch (e) {
    console.error(e);
    return errorResponse("Đăng nhập thất bại", 500);
  }
}
