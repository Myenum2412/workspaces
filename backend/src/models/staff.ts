import mongoose, { Schema, Document } from "mongoose";

export interface IStaff extends Document {
  userId: string;
  empId: string;
  email: string;
  passwordHash?: string;
  firstName: string;
  lastName: string;
  phone: string;
  designation: string;
  department: string;
  status: string;
  organizationId: string;
  role: string;
  joiningDate: string;
  employmentType: string;
  currentExperience: string;
  totalExperience: string;
  dob: string;
  gender: string;
  maritalStatus: string;
  sourceOfHire: string;
  bio: string;
  expertise: string[];
  pan: string;
  aadhaar: string;
  uan: string;
  presentAddress: string;
  permanentAddress: string;
  personalPhone: string;
  personalEmail: string;
  category: string;
  workExperience: any[];
  educationDetails: any[];
  dependentDetails: any[];
  avatarUrl?: string;
}

const StaffSchema = new Schema<IStaff>({
  userId: { type: String, required: true },
  empId: { type: String, required: true },
  email: { type: String, required: true },
  passwordHash: { type: String },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String },
  designation: { type: String },
  department: { type: String },
  status: { type: String, default: "Active" },
  organizationId: { type: String, required: true },
  role: { type: String, default: "staff" },
  joiningDate: { type: String },
  employmentType: { type: String },
  currentExperience: { type: String },
  totalExperience: { type: String },
  dob: { type: String },
  gender: { type: String },
  maritalStatus: { type: String },
  sourceOfHire: { type: String },
  bio: { type: String },
  expertise: [{ type: String }],
  pan: { type: String },
  aadhaar: { type: String },
  uan: { type: String },
  presentAddress: { type: String },
  permanentAddress: { type: String },
  personalPhone: { type: String },
  personalEmail: { type: String },
  category: { type: String },
  workExperience: [{ type: Schema.Types.Mixed }],
  educationDetails: [{ type: Schema.Types.Mixed }],
  dependentDetails: [{ type: Schema.Types.Mixed }],
  avatarUrl: { type: String },
}, { timestamps: true });

export const Staff = mongoose.models.Staff || mongoose.model<IStaff>("Staff", StaffSchema);
