import { NextRequest } from "next/server";
import { jsonResponse } from "@/src/lib/api";
import { getCookieName } from "@/src/lib/auth";

/** POST /api/auth/sign-out - clear session cookie */
export async function POST(_req: NextRequest) {
  const cookie = `${getCookieName()}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
  return new Response(
    JSON.stringify({ success: true, data: { signedIn: false } }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookie,
      },
    }
  );
}
