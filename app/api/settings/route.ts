import { NextRequest } from "next/server";
import { connectDB } from "@/src/lib/db";
import { getSalaryBaseDefault, setSalaryBaseDefault } from "@/src/models/Settings";
import { jsonResponse, errorResponse } from "@/src/lib/api";
import { z } from "zod";

const updateSettingsSchema = z.object({
  salaryBaseDefault: z.number().min(0),
});

/** GET /api/settings - returns { salaryBaseDefault } */
export async function GET() {
  try {
    await connectDB();
    const salaryBaseDefault = await getSalaryBaseDefault();
    return jsonResponse({ salaryBaseDefault });
  } catch (e) {
    console.error(e);
    return errorResponse("Failed to get settings", 500);
  }
}

/** PATCH /api/settings - body { salaryBaseDefault } */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = updateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }
    await connectDB();
    const salaryBaseDefault = await setSalaryBaseDefault(parsed.data.salaryBaseDefault);
    return jsonResponse({ salaryBaseDefault });
  } catch (e) {
    console.error(e);
    return errorResponse("Failed to update settings", 500);
  }
}
