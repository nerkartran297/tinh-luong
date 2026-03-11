import { NextRequest } from "next/server";
import { connectDB } from "@/src/lib/db";
import Employee from "@/src/models/Employee";
import EmployeePayrollProfile from "@/src/models/EmployeePayrollProfile";
import { getSalaryBaseDefault } from "@/src/models/Settings";
import { jsonResponse, errorResponse } from "@/src/lib/api";
import {
  employeeTypeSchema,
  roleSchema,
  z,
} from "@/src/types/payroll";

const createEmployeeSchema = z.object({
  fullName: z.string().min(1),
  employeeCode: z.string().min(1),
  role: roleSchema,
  employeeType: employeeTypeSchema,
  phone: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional().or(z.date().optional()),
  note: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const employeeType = searchParams.get("employeeType");
    const role = searchParams.get("role");
    const isActiveParam = searchParams.get("isActive");

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { fullName: new RegExp(escapeRegex(search), "i") },
        { employeeCode: new RegExp(escapeRegex(search), "i") },
      ];
    }
    if (employeeType) {
      const parsed = employeeTypeSchema.safeParse(employeeType);
      if (parsed.success) filter.employeeType = parsed.data;
    }
    if (role) {
      const parsed = roleSchema.safeParse(role);
      if (parsed.success) filter.role = parsed.data;
    }
    if (isActiveParam !== undefined && isActiveParam !== "") {
      filter.isActive = isActiveParam === "true";
    }

    const list = await Employee.find(filter).sort({ createdAt: -1 }).lean();
    return jsonResponse(list);
  } catch (e) {
    console.error(e);
    return errorResponse("Failed to list employees", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const parsed = createEmployeeSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }
    const data = parsed.data;
    const existing = await Employee.findOne({ employeeCode: data.employeeCode });
    if (existing) {
      return errorResponse("Employee code already exists", 400);
    }
    const doc = await Employee.create({
      ...data,
      dateOfBirth: data.dateOfBirth
        ? new Date(data.dateOfBirth as string)
        : undefined,
    });
    const salaryBase = await getSalaryBaseDefault();
    await EmployeePayrollProfile.create({
      employeeId: doc._id,
      salaryBase,
      salaryCoefficient: 0,
      positionAllowance: 0,
      regionAllowance: 0,
      pctnvk: 0,
      preferentialAllowance: 0,
      seniorityAllowance: 0,
      teachingSeniorityPercent: 0,
      insuranceMode: "percent",
      insurancePercent: 0,
      insuranceFixedAmount: 0,
      sickDeduction: 0,
    });
    return jsonResponse(doc.toObject(), 201);
  } catch (e) {
    console.error(e);
    return errorResponse("Failed to create employee", 500);
  }
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
