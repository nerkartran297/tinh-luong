import { NextRequest } from "next/server";
import { connectDB } from "@/src/lib/db";
import DeductionVoucher from "@/src/models/DeductionVoucher";
import { jsonResponse, errorResponse } from "@/src/lib/api";
import { objectIdSchema, deductionStatusSchema } from "@/src/types/payroll";
import { z } from "zod";

const updateDeductionSchema = z.object({
  title: z.string().min(1).optional(),
  amount: z.number().min(0).optional(),
  reason: z.string().optional(),
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().optional(),
  effectiveDate: z.string().optional().or(z.date().optional()),
  status: deductionStatusSchema.optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const parsedId = objectIdSchema.safeParse(id);
    if (!parsedId.success) {
      return errorResponse("Invalid deduction id", 400, parsedId.error);
    }
    const body = await req.json();
    const parsed = updateDeductionSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }
    await connectDB();
    const data = { ...parsed.data } as Record<string, unknown>;
    if (data.effectiveDate !== undefined) {
      data.effectiveDate = data.effectiveDate
        ? new Date(data.effectiveDate as string)
        : undefined;
    }
    const doc = await DeductionVoucher.findByIdAndUpdate(
      parsedId.data,
      { $set: data },
      { returnDocument: 'after' }
    ).lean();
    if (!doc) {
      return errorResponse("Deduction voucher not found", 404);
    }
    return jsonResponse(doc);
  } catch (e) {
    console.error(e);
    return errorResponse("Failed to update deduction voucher", 500);
  }
}

/** Hard delete. (Soft delete alternative: set status = 'cancelled' and document in comment.) */
export async function DELETE(
  _req: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const parsed = objectIdSchema.safeParse(id);
    if (!parsed.success) {
      return errorResponse("Invalid deduction id", 400, parsed.error);
    }
    await connectDB();
    const doc = await DeductionVoucher.findByIdAndDelete(parsed.data);
    if (!doc) {
      return errorResponse("Deduction voucher not found", 404);
    }
    return jsonResponse({ deleted: true });
  } catch (e) {
    console.error(e);
    return errorResponse("Failed to delete deduction voucher", 500);
  }
}
