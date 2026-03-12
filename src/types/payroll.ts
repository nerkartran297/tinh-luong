import { z } from "zod";

// Re-export for API validation
export { z };

// --- Enums / literals ---
export const EMPLOYEE_TYPES = ["bien-che", "hop-dong", "bao-ve"] as const;
export type EmployeeType = (typeof EMPLOYEE_TYPES)[number];

export const ROLES = [
  "hieu-truong",
  "pho-hieu-truong",
  "giao-vien",
  "ke-toan",
  "van-thu",
  "bao-ve",
  "giao-vien-hop-dong",
] as const;
export type Role = (typeof ROLES)[number];

export const INSURANCE_MODES = ["percent", "fixed", "auto-hd"] as const;
export type InsuranceMode = (typeof INSURANCE_MODES)[number];

export const DEDUCTION_VOUCHER_STATUSES = ["draft", "applied", "cancelled"] as const;
export type DeductionVoucherStatus = (typeof DEDUCTION_VOUCHER_STATUSES)[number];

// --- Zod schemas for validation ---
export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");

export const employeeTypeSchema = z.enum(EMPLOYEE_TYPES);
export const roleSchema = z.enum(ROLES);
export const insuranceModeSchema = z.enum(INSURANCE_MODES);
export const deductionStatusSchema = z.enum(DEDUCTION_VOUCHER_STATUSES);

export const monthSchema = z.number().int().min(1).max(12);
export const yearSchema = z.number().int().min(2000).max(2100);
export const nonNegativeNumberSchema = z.number().min(0);
export const percentSchema = z.number().min(0).max(1);

// --- Payroll row (output) ---
export interface PayrollRow {
  employeeId: string;
  fullName: string;
  role: string;
  employeeType: EmployeeType;
  salaryBase: number;
  salaryCoefficient: number;
  positionAllowance: number;
  regionAllowance: number;
  pctnvk: number;
  preferentialAllowance: number;
  seniorityAllowance: number;
  teachingSeniorityPercent: number;
  teachingSeniorityValue: number;
  totalCoefficient: number;
  grossSalary: number;
  sickDeduction: number;
  insuranceAmount: number;
  otherDeduction: number;
  netSalary: number;
  note?: string;
}

// --- Snapshot row (stored) ---
export interface PayrollSnapshotRow extends PayrollRow {}

// --- API response shape ---
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: unknown;
}
