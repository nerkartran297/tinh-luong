import mongoose, { Schema, Document, Model } from "mongoose";
import type { InsuranceMode } from "../types/payroll";

export interface IEmployeePayrollProfile extends Document {
  _id: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  salaryBase: number;
  salaryCoefficient: number;
  positionAllowance: number;
  regionAllowance: number;
  pctnvk: number;
  preferentialAllowance: number;
  seniorityAllowance: number;
  teachingSeniorityPercent: number;
  insuranceMode: InsuranceMode;
  insurancePercent: number;
  insuranceFixedAmount: number;
  grossSalaryOverride?: number;
  sickDeduction: number;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeePayrollProfileSchema = new Schema<IEmployeePayrollProfile>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      unique: true,
    },
    salaryBase: { type: Number, required: true, default: 2340000 },
    salaryCoefficient: { type: Number, default: 0 },
    positionAllowance: { type: Number, default: 0 },
    regionAllowance: { type: Number, default: 0 },
    pctnvk: { type: Number, default: 0 },
    preferentialAllowance: { type: Number, default: 0 },
    seniorityAllowance: { type: Number, default: 0 },
    teachingSeniorityPercent: { type: Number, default: 0 },
    insuranceMode: { type: String, required: true, enum: ["percent", "fixed"] },
    insurancePercent: { type: Number, default: 0 },
    insuranceFixedAmount: { type: Number, default: 0 },
    grossSalaryOverride: { type: Number },
    sickDeduction: { type: Number, default: 0 },
    note: { type: String },
  },
  { timestamps: true }
);

const EmployeePayrollProfile: Model<IEmployeePayrollProfile> =
  mongoose.models.EmployeePayrollProfile ??
  mongoose.model<IEmployeePayrollProfile>("EmployeePayrollProfile", EmployeePayrollProfileSchema);
export default EmployeePayrollProfile;
