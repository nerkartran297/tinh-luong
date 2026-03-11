import mongoose, { Schema, Document, Model } from "mongoose";
import type { EmployeeType, Role } from "../types/payroll";

export interface IEmployee extends Document {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  employeeCode: string;
  role: Role;
  employeeType: EmployeeType;
  phone?: string;
  gender?: string;
  dateOfBirth?: Date;
  note?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    fullName: { type: String, required: true },
    employeeCode: { type: String, required: true },
    role: { type: String, required: true, enum: ["hieu-truong", "pho-hieu-truong", "giao-vien", "ke-toan", "van-thu", "bao-ve", "giao-vien-hop-dong"] },
    employeeType: { type: String, required: true, enum: ["bien-che", "hop-dong", "bao-ve"] },
    phone: { type: String },
    gender: { type: String },
    dateOfBirth: { type: Date },
    note: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

EmployeeSchema.index({ employeeCode: 1 });
EmployeeSchema.index({ isActive: 1, employeeType: 1, role: 1 });

const Employee: Model<IEmployee> =
  mongoose.models.Employee ?? mongoose.model<IEmployee>("Employee", EmployeeSchema);
export default Employee;
