import mongoose, { Schema, Document, Model } from "mongoose";
import type { PayrollSnapshotRow } from "../types/payroll";

export interface IPayrollSnapshot extends Document {
  _id: mongoose.Types.ObjectId;
  month: number;
  year: number;
  salaryBaseDefault: number;
  rows: PayrollSnapshotRow[];
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayrollSnapshotRowSchema = new Schema(
  {
    employeeId: { type: String, required: true },
    fullName: { type: String, required: true },
    role: { type: String, required: true },
    employeeType: { type: String, required: true },
    salaryBase: { type: Number, required: true },
    salaryCoefficient: { type: Number, required: true },
    positionAllowance: { type: Number, required: true },
    regionAllowance: { type: Number, required: true },
    pctnvk: { type: Number, required: true },
    preferentialAllowance: { type: Number, required: true },
    seniorityAllowance: { type: Number, required: true },
    teachingSeniorityPercent: { type: Number, required: true },
    teachingSeniorityValue: { type: Number, required: true },
    totalCoefficient: { type: Number, required: true },
    grossSalary: { type: Number, required: true },
    sickDeduction: { type: Number, required: true },
    insuranceAmount: { type: Number, required: true },
    otherDeduction: { type: Number, required: true },
    netSalary: { type: Number, required: true },
    note: { type: String },
  },
  { _id: false }
);

const PayrollSnapshotSchema = new Schema<IPayrollSnapshot>(
  {
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    salaryBaseDefault: { type: Number, required: true },
    rows: [PayrollSnapshotRowSchema],
    note: { type: String },
  },
  { timestamps: true }
);

PayrollSnapshotSchema.index({ year: 1, month: 1 }, { unique: true });

const PayrollSnapshot: Model<IPayrollSnapshot> =
  mongoose.models.PayrollSnapshot ??
  mongoose.model<IPayrollSnapshot>("PayrollSnapshot", PayrollSnapshotSchema);
export default PayrollSnapshot;
