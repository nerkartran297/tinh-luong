import { NextRequest } from "next/server";
import { connectDB } from "@/src/lib/db";
import Employee from "@/src/models/Employee";
import EmployeePayrollProfile from "@/src/models/EmployeePayrollProfile";
import DeductionVoucher from "@/src/models/DeductionVoucher";
import { jsonResponse, errorResponse } from "@/src/lib/api";
import { objectIdSchema } from "@/src/types/payroll";
import {
  employeeTypeSchema,
  roleSchema,
  z,
} from "@/src/types/payroll";

const updateEmployeeSchema = z.object({
  fullName: z.string().min(1).optional(),
  employeeCode: z.string().min(1).optional(),
  role: roleSchema.optional(),
  employeeType: employeeTypeSchema.optional(),
  phone: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional().or(z.date().optional()),
  note: z.string().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _req: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const parsed = objectIdSchema.safeParse(id);
    if (!parsed.success) {
      return errorResponse("Invalid employee id", 400, parsed.error);
    }
    await connectDB();
    const doc = await Employee.findById(parsed.data).lean();
    if (!doc) {
      return errorResponse("Employee not found", 404);
    }
    return jsonResponse(doc);
  } catch (e) {
    console.error(e);
    return errorResponse("Failed to get employee", 500);
  }
}

export async function PATCH(
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
    const parsed = updateEmployeeSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }
    await connectDB();
    const data = { ...parsed.data } as Record<string, unknown>;
    if (data.dateOfBirth !== undefined) {
      data.dateOfBirth = data.dateOfBirth
        ? new Date(data.dateOfBirth as string)
        : undefined;
    }
    const doc = await Employee.findByIdAndUpdate(
      parsedId.data,
      { $set: data },
      { returnDocument: 'after' }
    ).lean();
    if (!doc) {
      return errorResponse("Employee not found", 404);
    }
    return jsonResponse(doc);
  } catch (e) {
    console.error(e);
    return errorResponse("Failed to update employee", 500);
  }
}

/** Soft delete (default): set isActive = false. Hard delete: ?hard=true — xóa hẳn nhân viên + hồ sơ lương + phiếu khấu trừ. */
export async function DELETE(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const parsed = objectIdSchema.safeParse(id);
    if (!parsed.success) {
      return errorResponse("Invalid employee id", 400, parsed.error);
    }
    const hard = req.nextUrl.searchParams.get("hard") === "true";
    await connectDB();

    if (hard) {
      const employeeId = parsed.data;
      await Promise.all([
        EmployeePayrollProfile.deleteOne({ employeeId }),
        DeductionVoucher.deleteMany({ employeeId }),
      ]);
      const doc = await Employee.findByIdAndDelete(employeeId);
      if (!doc) {
        return errorResponse("Employee not found", 404);
      }
      return jsonResponse({ deleted: true, id: String(doc._id) });
    }

    const doc = await Employee.findByIdAndUpdate(
      parsed.data,
      { $set: { isActive: false } },
      { returnDocument: 'after' }
    ).lean();
    if (!doc) {
      return errorResponse("Employee not found", 404);
    }
    return jsonResponse(doc);
  } catch (e) {
    console.error(e);
    return errorResponse("Failed to delete employee", 500);
  }
}
