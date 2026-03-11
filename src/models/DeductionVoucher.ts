import mongoose, { Schema, Document, Model } from "mongoose";
import type { DeductionVoucherStatus } from "../types/payroll";

export interface IDeductionVoucher extends Document {
  _id: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  title: string;
  amount: number;
  reason: string;
  month: number;
  year: number;
  effectiveDate: Date;
  status: DeductionVoucherStatus;
  createdAt: Date;
  updatedAt: Date;
}

const DeductionVoucherSchema = new Schema<IDeductionVoucher>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, default: "" },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    effectiveDate: { type: Date, required: true },
    status: {
      type: String,
      required: true,
      enum: ["draft", "applied", "cancelled"],
      default: "draft",
    },
  },
  { timestamps: true }
);

DeductionVoucherSchema.index({ employeeId: 1, year: 1, month: 1 });
DeductionVoucherSchema.index({ status: 1 });

const DeductionVoucher: Model<IDeductionVoucher> =
  mongoose.models.DeductionVoucher ??
  mongoose.model<IDeductionVoucher>("DeductionVoucher", DeductionVoucherSchema);
export default DeductionVoucher;
