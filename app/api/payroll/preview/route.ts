import { NextRequest } from "next/server";
import { connectDB } from "@/src/lib/db";
import Employee from "@/src/models/Employee";
import EmployeePayrollProfile from "@/src/models/EmployeePayrollProfile";
import DeductionVoucher from "@/src/models/DeductionVoucher";
import { getSalaryBaseDefault } from "@/src/models/Settings";
import { jsonResponse, errorResponse } from "@/src/lib/api";
import { buildPayrollRow } from "@/src/lib/payroll";
import { monthSchema, yearSchema } from "@/src/types/payroll";
import { z } from "zod";

const previewQuerySchema = z.object({
  month: z.coerce.number().pipe(monthSchema),
  year: z.coerce.number().pipe(yearSchema),
  employeeType: z.enum(["bien-che", "hop-dong", "bao-ve"]).optional(),
});

/** GET /api/payroll/preview?month=3&year=2025 - returns payroll preview rows */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = previewQuerySchema.safeParse({
      month: searchParams.get("month") ?? undefined,
      year: searchParams.get("year") ?? undefined,
      employeeType: searchParams.get("employeeType") ?? undefined,
    });
    if (!parsed.success) {
      return errorResponse("Invalid query (month 1-12, year required)", 400, parsed.error.flatten());
    }
    const { month, year, employeeType } = parsed.data;
    await connectDB();
    const salaryBaseDefault = await getSalaryBaseDefault();
    const employeeFilter: Record<string, unknown> = { isActive: true };
    if (employeeType) employeeFilter.employeeType = employeeType;
    const employees = await Employee.find(employeeFilter).lean();
    const employeeIds = employees.map((e) => e._id);
    const [profiles, vouchers] = await Promise.all([
      EmployeePayrollProfile.find({ employeeId: { $in: employeeIds } }).lean(),
      DeductionVoucher.find({ employeeId: { $in: employeeIds } }).lean(),
    ]);
    const profileByEmployee = new Map(
      profiles.map((p) => [String((p as { employeeId: unknown }).employeeId), p])
    );
    const vouchersByEmployee = new Map<string, typeof vouchers>();
    for (const v of vouchers) {
      const eid = String((v as { employeeId: unknown }).employeeId);
      if (!vouchersByEmployee.has(eid)) vouchersByEmployee.set(eid, []);
      vouchersByEmployee.get(eid)!.push(v);
    }

    const rows = employees.map((emp) => {
      const profile = profileByEmployee.get(String(emp._id)) ?? null;
      const empVouchers = vouchersByEmployee.get(String(emp._id)) ?? [];
      return buildPayrollRow(
        emp as Parameters<typeof buildPayrollRow>[0],
        profile as Parameters<typeof buildPayrollRow>[1],
        empVouchers as Parameters<typeof buildPayrollRow>[2],
        month,
        year,
        salaryBaseDefault
      );
    });

    return jsonResponse({
      month,
      year,
      salaryBaseDefault,
      rows,
    });
  } catch (e) {
    console.error(e);
    return errorResponse("Failed to build payroll preview", 500);
  }
}

const previewBodySchema = z.object({
  month: monthSchema,
  year: yearSchema,
  employeeType: z.enum(["bien-che", "hop-dong", "bao-ve"]).optional(),
});

/** POST /api/payroll/preview - same as GET, body { month, year?, employeeType? } */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = previewBodySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Invalid body (month 1-12, year required)", 400, parsed.error.flatten());
    }
    const { month, year, employeeType } = parsed.data;
    await connectDB();
    const salaryBaseDefault = await getSalaryBaseDefault();
    const employeeFilter: Record<string, unknown> = { isActive: true };
    if (employeeType) employeeFilter.employeeType = employeeType;
    const employees = await Employee.find(employeeFilter).lean();
    const employeeIds = employees.map((e) => e._id);
    const [profiles, vouchers] = await Promise.all([
      EmployeePayrollProfile.find({ employeeId: { $in: employeeIds } }).lean(),
      DeductionVoucher.find({ employeeId: { $in: employeeIds } }).lean(),
    ]);
    const profileByEmployee = new Map(
      profiles.map((p) => [String((p as { employeeId: unknown }).employeeId), p])
    );
    const vouchersByEmployee = new Map<string, typeof vouchers>();
    for (const v of vouchers) {
      const eid = String((v as { employeeId: unknown }).employeeId);
      if (!vouchersByEmployee.has(eid)) vouchersByEmployee.set(eid, []);
      vouchersByEmployee.get(eid)!.push(v);
    }

    const rows = employees.map((emp) => {
      const profile = profileByEmployee.get(String(emp._id)) ?? null;
      const empVouchers = vouchersByEmployee.get(String(emp._id)) ?? [];
      return buildPayrollRow(
        emp as Parameters<typeof buildPayrollRow>[0],
        profile as Parameters<typeof buildPayrollRow>[1],
        empVouchers as Parameters<typeof buildPayrollRow>[2],
        month,
        year,
        salaryBaseDefault
      );
    });

    return jsonResponse({
      month,
      year,
      salaryBaseDefault,
      rows,
    });
  } catch (e) {
    console.error(e);
    return errorResponse("Failed to build payroll preview", 500);
  }
}
