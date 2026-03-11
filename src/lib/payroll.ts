import type { IEmployee } from "../models/Employee";
import type { IEmployeePayrollProfile } from "../models/EmployeePayrollProfile";
import type { IDeductionVoucher } from "../models/DeductionVoucher";
import type {
  EmployeeType,
  PayrollRow,
  InsuranceMode,
} from "../types/payroll";

/** Profile-like shape for calculations (plain object or document) */
export type PayrollProfileInput = Pick<
  IEmployeePayrollProfile,
  | "salaryBase"
  | "salaryCoefficient"
  | "positionAllowance"
  | "regionAllowance"
  | "pctnvk"
  | "preferentialAllowance"
  | "seniorityAllowance"
  | "teachingSeniorityPercent"
  | "insuranceMode"
  | "insurancePercent"
  | "insuranceFixedAmount"
  | "grossSalaryOverride"
  | "sickDeduction"
  | "note"
>;

/** Biên chế: heSoTNNG = (heSoLuong + phuCapChucVu + pctnvk) * phanTramTNNG */
export function calculateTeachingSeniorityValue(
  profile: PayrollProfileInput
): number {
  const base =
    (profile.salaryCoefficient ?? 0) +
    (profile.positionAllowance ?? 0) +
    (profile.pctnvk ?? 0);
  return base * (profile.teachingSeniorityPercent ?? 0);
}

/** Biên chế: tongHeSo = sum of all coefficients + heSoTNNG. Hợp đồng/bảo vệ: 0. */
export function calculateTotalCoefficient(
  profile: PayrollProfileInput,
  employeeType: EmployeeType
): number {
  if (employeeType !== "bien-che") {
    return 0;
  }
  const teachingValue = calculateTeachingSeniorityValue(profile);
  return (
    (profile.salaryCoefficient ?? 0) +
    (profile.positionAllowance ?? 0) +
    (profile.regionAllowance ?? 0) +
    (profile.pctnvk ?? 0) +
    (profile.preferentialAllowance ?? 0) +
    (profile.seniorityAllowance ?? 0) +
    teachingValue
  );
}

/** Lương gộp: biên chế = tongHeSo * luongCoBan; hợp đồng/bảo vệ = grossSalaryOverride || salaryBase */
export function calculateGrossSalary(
  profile: PayrollProfileInput,
  employeeType: EmployeeType
): number {
  if (employeeType === "bien-che") {
    const total = calculateTotalCoefficient(profile, "bien-che");
    return total * (profile.salaryBase ?? 0);
  }
  return (
    profile.grossSalaryOverride ?? profile.salaryBase ?? 0
  );
}

/** BHXH: fixed => insuranceFixedAmount; percent => nền theo quy định (biên chế vs hợp đồng/bảo vệ) */
export function calculateInsuranceAmount(
  profile: PayrollProfileInput,
  employeeType: EmployeeType,
  grossSalary: number
): number {
  const mode: InsuranceMode = profile.insuranceMode ?? "percent";
  if (mode === "fixed") {
    return profile.insuranceFixedAmount ?? 0;
  }
  const percent = profile.insurancePercent ?? 0;
  if (employeeType === "bien-che") {
    const insuranceBaseCoefficient =
      (profile.salaryCoefficient ?? 0) +
      (profile.positionAllowance ?? 0) +
      (profile.pctnvk ?? 0) +
      calculateTeachingSeniorityValue(profile);
    return insuranceBaseCoefficient * (profile.salaryBase ?? 0) * percent;
  }
  return grossSalary * percent;
}

/** thucNhan = grossSalary - sickDeduction - insuranceAmount - otherDeduction */
export function calculateNetSalary(params: {
  grossSalary: number;
  sickDeduction: number;
  insuranceAmount: number;
  otherDeduction: number;
}): number {
  return Math.max(
    0,
    params.grossSalary -
      params.sickDeduction -
      params.insuranceAmount -
      params.otherDeduction
  );
}

/** otherDeduction = tổng các phiếu khấu trừ status=applied hoặc draft trong tháng/năm */
export function sumOtherDeduction(
  vouchers: { amount: number; status: string; month: number; year: number }[],
  month: number,
  year: number
): number {
  return vouchers
    .filter(
      (v) =>
        (v.status === "applied" || v.status === "draft") &&
        v.month === month &&
        v.year === year
    )
    .reduce((s, v) => s + v.amount, 0);
}

/** Build one payroll row for an employee from profile + vouchers for the given month/year */
export function buildPayrollRow(
  employee: IEmployee,
  profile: PayrollProfileInput | null,
  vouchers: IDeductionVoucher[],
  month: number,
  year: number,
  salaryBaseDefault: number
): PayrollRow {
  const employeeType = employee.employeeType as EmployeeType;
  const salaryBase = profile?.salaryBase ?? salaryBaseDefault;
  const safeProfile: PayrollProfileInput = profile ?? {
    salaryBase: salaryBaseDefault,
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
  };

  const teachingSeniorityValue =
    employeeType === "bien-che"
      ? calculateTeachingSeniorityValue(safeProfile)
      : 0;
  const totalCoefficient = calculateTotalCoefficient(
    safeProfile,
    employeeType
  );
  const grossSalary = calculateGrossSalary(safeProfile, employeeType);
  const insuranceAmount = calculateInsuranceAmount(
    safeProfile,
    employeeType,
    grossSalary
  );
  const sickDeduction = safeProfile.sickDeduction ?? 0;
  const otherDeduction = sumOtherDeduction(
    vouchers as unknown as { amount: number; status: string; month: number; year: number }[],
    month,
    year
  );
  const netSalary = calculateNetSalary({
    grossSalary,
    sickDeduction,
    insuranceAmount,
    otherDeduction,
  });

  const roleDisplay =
    typeof employee.role === "string" ? employee.role : (employee as IEmployee & { role: string }).role;

  return {
    employeeId: String(employee._id),
    fullName: employee.fullName,
    role: roleDisplay,
    employeeType,
    salaryBase,
    salaryCoefficient: safeProfile.salaryCoefficient ?? 0,
    positionAllowance: safeProfile.positionAllowance ?? 0,
    regionAllowance: safeProfile.regionAllowance ?? 0,
    pctnvk: safeProfile.pctnvk ?? 0,
    preferentialAllowance: safeProfile.preferentialAllowance ?? 0,
    seniorityAllowance: safeProfile.seniorityAllowance ?? 0,
    teachingSeniorityPercent: safeProfile.teachingSeniorityPercent ?? 0,
    teachingSeniorityValue,
    totalCoefficient,
    grossSalary,
    sickDeduction,
    insuranceAmount,
    otherDeduction,
    netSalary,
    note: safeProfile.note,
  };
}
