import { NextRequest } from "next/server";
import { connectDB } from "@/src/lib/db";
import PayrollSnapshot from "@/src/models/PayrollSnapshot";
import { jsonResponse, errorResponse } from "@/src/lib/api";
import { objectIdSchema } from "@/src/types/payroll";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _req: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const parsed = objectIdSchema.safeParse(id);
    if (!parsed.success) {
      return errorResponse("Invalid snapshot id", 400, parsed.error);
    }
    await connectDB();
    const doc = await PayrollSnapshot.findById(parsed.data).lean();
    if (!doc) {
      return errorResponse("Snapshot not found", 404);
    }
    return jsonResponse(doc);
  } catch (e) {
    console.error(e);
    return errorResponse("Failed to get snapshot", 500);
  }
}
