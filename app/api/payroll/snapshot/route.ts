import { NextRequest } from "next/server";
import { connectDB } from "@/src/lib/db";
import PayrollSnapshot from "@/src/models/PayrollSnapshot";
import Employee from "@/src/models/Employee";
import EmployeePayrollProfile from "@/src/models/EmployeePayrollProfile";
import DeductionVoucher from "@/src/models/DeductionVoucher";
import { getSalaryBaseDefault } from "@/src/models/Settings";
import { jsonResponse, errorResponse } from "@/src/lib/api";
import { buildPayrollRow } from "@/src/lib/payroll";
import { monthSchema, yearSchema } from "@/src/types/payroll";
import { z } from "zod";

const createSnapshotSchema = z.object({
  month: monthSchema,
  year: yearSchema,
  salaryBaseDefault: z.number().min(0).optional(),
  note: z.string().optional(),
});

/** GET /api/payroll/snapshot - list snapshots (optional month, year query) */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const filter: Record<string, unknown> = {};
    if (month != null && month !== "") {
      const m = parseInt(month, 10);
      if (m >= 1 && m <= 12) filter.month = m;
    }
    if (year != null && year !== "") {
      const y = parseInt(year, 10);
      if (!Number.isNaN(y)) filter.year = y;
    }
    const list = await PayrollSnapshot.find(filter)
      .sort({ year: -1, month: -1 })
      .lean();
    return jsonResponse(list);
  } catch (e) {
    console.error(e);
    return errorResponse("Failed to list snapshots", 500);
  }
}

/** POST /api/payroll/snapshot - create snapshot from current payroll preview */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = createSnapshotSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Invalid body (month 1-12, year required)", 400, parsed.error.flatten());
    }
    const { month, year, note } = parsed.data;
    await connectDB();
    const salaryBaseDefault =
      parsed.data.salaryBaseDefault ?? (await getSalaryBaseDefault());

    const existing = await PayrollSnapshot.findOne({ month, year }).lean();
    if (existing) {
      return errorResponse("Snapshot for this month/year already exists", 400);
    }

    const employees = await Employee.find({ isActive: true }).lean();
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

    const doc = await PayrollSnapshot.create({
      month,
      year,
      salaryBaseDefault,
      rows,
      note,
    });
    return jsonResponse(doc.toObject(), 201);
  } catch (e) {
    console.error(e);
    return errorResponse("Failed to create snapshot", 500);
  }
}
