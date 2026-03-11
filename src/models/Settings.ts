import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISettings extends Document {
  salaryBaseDefault: number;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    salaryBaseDefault: { type: Number, required: true, default: 2340000 },
  },
  { timestamps: true }
);

// Single document: use collection with one doc, findOne/update
const Settings: Model<ISettings> =
  mongoose.models.Settings ??
  mongoose.model<ISettings>("Settings", SettingsSchema);

const DEFAULT_SALARY_BASE = 2340000;

export async function getSalaryBaseDefault(): Promise<number> {
  const doc = await Settings.findOne().lean();
  return doc?.salaryBaseDefault ?? DEFAULT_SALARY_BASE;
}

export async function setSalaryBaseDefault(value: number): Promise<number> {
  const doc = await Settings.findOneAndUpdate(
    {},
    { $set: { salaryBaseDefault: value } },
    { returnDocument: 'after', upsert: true }
  );
  return doc.salaryBaseDefault;
}

export default Settings;
