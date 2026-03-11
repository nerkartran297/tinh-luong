import { NextRequest } from "next/server";
import { connectDB } from "@/src/lib/db";
import Employee from "@/src/models/Employee";
import EmployeePayrollProfile from "@/src/models/EmployeePayrollProfile";
import { jsonResponse, errorResponse } from "@/src/lib/api";
import { objectIdSchema, insuranceModeSchema } from "@/src/types/payroll";
import DeductionVoucher from "@/src/models/DeductionVoucher";
import {
  calculateTeachingSeniorityValue,
  calculateTotalCoefficient,
  calculateGrossSalary,
  calculateInsuranceAmount,
  calculateNetSalary,
  sumOtherDeduction,
} from "@/src/lib/payroll";
import type { EmployeeType } from "@/src/types/payroll";
import { z } from "zod";

const putPayrollProfileSchema = z.object({
  salaryBase: z.number().min(0).optional(),
  salaryCoefficient: z.number().min(0).optional(),
  positionAllowance: z.number().min(0).optional(),
  regionAllowance: z.number().min(0).optional(),
  pctnvk: z.number().min(0).optional(),
  preferentialAllowance: z.number().min(0).optional(),
  seniorityAllowance: z.number().min(0).optional(),
  teachingSeniorityPercent: z.number().min(0).max(1).optional(),
  insuranceMode: insuranceModeSchema.optional(),
  insurancePercent: z.number().min(0).max(1).optional(),
  insuranceFixedAmount: z.number().min(0).optional(),
  grossSalaryOverride: z.number().min(0).optional(),
  sickDeduction: z.number().min(0).optional(),
  note: z.string().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

function toPayload(
  profile: { toObject?: () => Record<string, unknown> } | Record<string, unknown>,
  employee: { employeeType: unknown },
  opts?: { vouchers?: { amount: number; status: string; month: number; year: number }[]; month: number; year: number }
) {
  const raw = typeof profile.toObject === "function" ? profile.toObject() : profile;
  const empType = employee.employeeType as EmployeeType;
  const teachingValue = calculateTeachingSeniorityValue(raw as Parameters<typeof calculateTeachingSeniorityValue>[0]);
  const totalCoefficient = calculateTotalCoefficient(raw as Parameters<typeof calculateTotalCoefficient>[0], empType);
  const grossSalary = calculateGrossSalary(raw as Parameters<typeof calculateGrossSalary>[0], empType);
  const insuranceAmount = calculateInsuranceAmount(
    raw as Parameters<typeof calculateInsuranceAmount>[0],
    empType,
    grossSalary
  );
  const sickDeduction = Number(raw.sickDeduction ?? 0);
  const otherDeduction = opts?.vouchers && opts.month != null && opts.year != null
    ? sumOtherDeduction(opts.vouchers, opts.month, opts.year)
    : 0;
  const netSalary = calculateNetSalary({
    grossSalary,
    sickDeduction,
    insuranceAmount,
    otherDeduction,
  });
  return {
    ...raw,
    teachingSeniorityValue: teachingValue,
    totalCoefficient,
    grossSalary,
    insuranceAmount,
    otherDeduction,
    netSalary,
  };
}

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
    const now = new Date();
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") != null ? parseInt(searchParams.get("month")!, 10) : now.getMonth() + 1;
    const year = searchParams.get("year") != null ? parseInt(searchParams.get("year")!, 10) : now.getFullYear();
    await connectDB();
    const employee = await Employee.findById(parsed.data).lean();
    if (!employee) {
      return errorResponse("Employee not found", 404);
    }
    const profile = await EmployeePayrollProfile.findOne({
      employeeId: parsed.data,
    });
    if (!profile) {
      return jsonResponse(null);
    }
    const vouchers = await DeductionVoucher.find({ employeeId: parsed.data }).lean();
    const voucherList = vouchers.map((v) => ({
      amount: v.amount,
      status: v.status,
      month: v.month,
      year: v.year,
    }));
    const payload = toPayload(profile, employee as { employeeType: unknown }, {
      vouchers: voucherList,
      month: month >= 1 && month <= 12 ? month : now.getMonth() + 1,
      year: !Number.isNaN(year) && year >= 2000 ? year : now.getFullYear(),
    });
    return jsonResponse(payload);
  } catch (e) {
    console.error(e);
    return errorResponse("Failed to get payroll profile", 500);
  }
}

export async function PUT(
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
    const parsed = putPayrollProfileSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }
    await connectDB();
    const employee = await Employee.findById(parsedId.data).lean();
    if (!employee) {
      return errorResponse("Employee not found", 404);
    }
    const defaults = {
      salaryBase: 2340000,
      salaryCoefficient: 0,
      positionAllowance: 0,
      regionAllowance: 0,
      pctnvk: 0,
      preferentialAllowance: 0,
      seniorityAllowance: 0,
      teachingSeniorityPercent: 0,
      insuranceMode: "percent" as const,
      insurancePercent: 0,
      insuranceFixedAmount: 0,
      sickDeduction: 0,
    };
    const profile = await EmployeePayrollProfile.findOneAndUpdate(
      { employeeId: parsedId.data },
      { $set: { ...defaults, ...parsed.data } },
      { returnDocument: 'after', upsert: true }
    );
    const now = new Date();
    const vouchers = await DeductionVoucher.find({ employeeId: parsedId.data }).lean();
    const voucherList = vouchers.map((v) => ({
      amount: v.amount,
      status: v.status,
      month: v.month,
      year: v.year,
    }));
    const payload = toPayload(profile!, employee as { employeeType: unknown }, {
      vouchers: voucherList,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });
    return jsonResponse(payload);
  } catch (e) {
    console.error(e);
    return errorResponse("Failed to save payroll profile", 500);
  }
}
