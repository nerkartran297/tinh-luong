import { NextRequest } from "next/server";
import { connectDB } from "@/src/lib/db";
import Employee from "@/src/models/Employee";
import DeductionVoucher from "@/src/models/DeductionVoucher";
import { jsonResponse, errorResponse } from "@/src/lib/api";
import { objectIdSchema } from "@/src/types/payroll";
import { z } from "zod";
import { deductionStatusSchema, monthSchema, yearSchema } from "@/src/types/payroll";

const createDeductionSchema = z.object({
  title: z.string().min(1),
  amount: z.number().min(0),
  reason: z.string().optional(),
  month: monthSchema,
  year: yearSchema,
  effectiveDate: z.string().min(1).or(z.date()),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const parsed = objectIdSchema.safeParse(id);
    if (!parsed.success) {
      return errorResponse("Invalid employee id", 400, parsed.error);
    }
    await connectDB();
    const employee = await Employee.findById(parsed.data).lean();
    if (!employee) {
      return errorResponse("Employee not found", 404);
    }
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const status = searchParams.get("status");

    const filter: Record<string, unknown> = { employeeId: parsed.data };
    if (month != null && month !== "") {
      const m = parseInt(month, 10);
      if (m >= 1 && m <= 12) filter.month = m;
    }
    if (year != null && year !== "") {
      const y = parseInt(year, 10);
      if (!Number.isNaN(y)) filter.year = y;
    }
    if (status) {
      const st = deductionStatusSchema.safeParse(status);
      if (st.success) filter.status = st.data;
    }

    const list = await DeductionVoucher.find(filter)
      .sort({ year: -1, month: -1, createdAt: -1 })
      .lean();
    return jsonResponse(list);
  } catch (e) {
    console.error(e);
    return errorResponse("Failed to list deductions", 500);
  }
}

export async function POST(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const parsedId = objectIdSchema.safeParse(id);
    if (!parsedId.success) {
      return errorResponse("Invalid employee id", 400, parsedId.error);
    }
    const body = await req.json();
    const parsed = createDeductionSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }
    await connectDB();
    const employee = await Employee.findById(parsedId.data).lean();
    if (!employee) {
      return errorResponse("Employee not found", 404);
    }
    const doc = await DeductionVoucher.create({
      employeeId: parsedId.data,
      title: parsed.data.title,
      amount: parsed.data.amount,
      reason: parsed.data.reason ?? "",
      month: parsed.data.month,
      year: parsed.data.year,
      effectiveDate: new Date(parsed.data.effectiveDate as string),
      status: "draft",
    });
    return jsonResponse(doc.toObject(), 201);
  } catch (e) {
    console.error(e);
    return errorResponse("Failed to create deduction voucher", 500);
  }
}
