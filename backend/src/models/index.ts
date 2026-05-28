import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrganization extends Document<string> {
  name: string;
  category?: string;
  companyRange?: string;
  email?: string;
  ownerEmail?: string;
  ownerId?: string;
  logoUrl?: string;
  industry?: string;
  size?: string;
  settings?: string;
  createdAt?: string;
}

const OrganizationSchema = new Schema<IOrganization>({
  _id: { type: String },
  name: { type: String, required: true },
  category: String,
  companyRange: String,
  email: String,
  ownerEmail: String,
  ownerId: String,
  logoUrl: String,
  industry: String,
  size: String,
  settings: String,
  createdAt: String,
}, { timestamps: true });

export const Organization = mongoose.models.Organization ?? mongoose.model<IOrganization>("Organization", OrganizationSchema);

export interface IUserProfile extends Document<string> {
  userId: string;
  firstName: string;
  lastName?: string;
  email: string;
  passwordHash?: string;
  phone?: string;
  designation?: string;
  department?: string;
  avatarUrl?: string;
  bio?: string;
  expertise?: string[];
  organizationId?: string;
  role?: string;
  status?: string;
  preferences?: string;
  nickname?: string;
  empId?: string;
  joiningDate?: string;
  mobile?: string;
  employmentType?: string;
  currentExperience?: string;
  totalExperience?: string;
  dob?: string;
  gender?: string;
  maritalStatus?: string;
  sourceOfHire?: string;
  pan?: string;
  aadhaar?: string;
  uan?: string;
  presentAddress?: string;
  permanentAddress?: string;
  personalPhone?: string;
  personalEmail?: string;
  emailVerified?: boolean;
  resetPasswordOTP?: string;
  resetPasswordExpires?: Date;
}

const UserProfileSchema = new Schema<IUserProfile>({
  _id: { type: String },
  userId: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, default: "" },
  email: { type: String, required: true },
  passwordHash: String,
  phone: String,
  designation: String,
  department: String,
  avatarUrl: String,
  bio: String,
  expertise: [{ type: String }],
  organizationId: String,
  role: String,
  status: { type: String, default: "active" },
  preferences: String,
  nickname: String,
  empId: String,
  joiningDate: String,
  mobile: String,
  employmentType: String,
  currentExperience: String,
  totalExperience: String,
  dob: String,
  gender: String,
  maritalStatus: String,
  sourceOfHire: String,
  pan: String,
  aadhaar: String,
  uan: String,
  presentAddress: String,
  permanentAddress: String,
  personalPhone: String,
  personalEmail: String,
  emailVerified: { type: Boolean, default: false },
  resetPasswordOTP: String,
  resetPasswordExpires: Date,
}, { timestamps: true });

export const UserProfile = mongoose.models.UserProfile ?? mongoose.model<IUserProfile>("UserProfile", UserProfileSchema);

export interface IOrgMember extends Document<string> {
  organizationId: string;
  userId: string;
  role: string;
  status: string;
  invitedBy?: string;
  joinedAt?: string;
}

const OrgMemberSchema = new Schema<IOrgMember>({
  _id: { type: String },
  organizationId: { type: String, required: true },
  userId: { type: String, required: true },
  role: { type: String, required: true },
  status: { type: String, required: true },
  invitedBy: String,
  joinedAt: String,
}, { timestamps: true });

export const OrgMember = mongoose.models.OrgMember ?? mongoose.model<IOrgMember>("OrgMember", OrgMemberSchema);

export interface IOrgInvitation extends Document<string> {
  organizationId: string;
  email: string;
  role: string;
  invitedBy: string;
  token: string;
  status: string;
  expiresAt: string;
}

const OrgInvitationSchema = new Schema<IOrgInvitation>({
  _id: { type: String },
  organizationId: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, required: true },
  invitedBy: { type: String, required: true },
  token: { type: String, required: true },
  status: { type: String, required: true },
  expiresAt: { type: String, required: true },
}, { timestamps: true });

export const OrgInvitation = mongoose.models.OrgInvitation ?? mongoose.model<IOrgInvitation>("OrgInvitation", OrgInvitationSchema);

export interface IClient extends Document<string> {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  status: string;
  industry?: string;
  location?: string;
  logoId?: string;
  organizationId: string;
  createdAt?: string;
  updatedAt?: string;
}

const ClientSchema = new Schema<IClient>({
  _id: { type: String },
  name: { type: String, required: true },
  contactPerson: String,
  email: String,
  phone: String,
  status: { type: String, required: true },
  industry: String,
  location: String,
  logoId: String,
  organizationId: { type: String, required: true },
  createdAt: String,
  updatedAt: String,
}, { timestamps: true });

export const Client = mongoose.models.Client ?? mongoose.model<IClient>("Client", ClientSchema);

export interface ITask extends Document<string> {
  taskNo: string;
  task: string;
  assignedTo: string;
  delegatedBy: string;


  status: string;
  priority: string;
  dueDate: string;

  finalStatus: string;
  organizationId: string;
}

const TaskSchema = new Schema<ITask>({
  _id: { type: String },
  taskNo: { type: String, required: true },
  task: { type: String, required: true },
  assignedTo: String,
  delegatedBy: String,


  status: { type: String, required: true },
  priority: String,
  dueDate: String,

  finalStatus: String,
  organizationId: { type: String, required: true },
}, { timestamps: true });

export const Task = mongoose.models.Task ?? mongoose.model<ITask>("Task", TaskSchema);

export interface ITeam extends Document<string> {
  name: string;
  head: string;
  members: number;
  projects: number;
  status: string;
  organizationId: string;
}

const TeamSchema = new Schema<ITeam>({
  _id: { type: String },
  name: { type: String, required: true },
  head: String,
  members: Number,
  projects: Number,
  status: { type: String, required: true },
  organizationId: { type: String, required: true },
}, { timestamps: true });

export const Team = mongoose.models.Team ?? mongoose.model<ITeam>("Team", TeamSchema);

export interface IBranch extends Document<string> {
  name: string;
  address?: string;
  managerName?: string;
  status: string;
  organizationId: string;
}

const BranchSchema = new Schema<IBranch>({
  _id: { type: String },
  name: { type: String, required: true },
  address: String,
  managerName: String,
  status: { type: String, required: true },
  organizationId: { type: String, required: true },
}, { timestamps: true });

export const Branch = mongoose.models.Branch ?? mongoose.model<IBranch>("Branch", BranchSchema);

export interface ISavedTask extends Document<string> {
  title: string;
  description: string;
  priority: string;
  taskType: string;
  assignedType: string;
  estimatedTime: string;
  templateCategory: string;
  organizationId: string;
}

const SavedTaskSchema = new Schema<ISavedTask>({
  _id: { type: String },
  title: { type: String, required: true },
  description: String,
  priority: String,
  taskType: String,
  assignedType: String,
  estimatedTime: String,
  templateCategory: String,
  organizationId: { type: String, required: true },
}, { timestamps: true });

export const SavedTask = mongoose.models.SavedTask ?? mongoose.model<ISavedTask>("SavedTask", SavedTaskSchema);

export interface IMasterData extends Document<string> {
  name: string;
  values: string[];
  organizationId: string;
}

const MasterDataSchema = new Schema<IMasterData>({
  _id: { type: String },
  name: { type: String, required: true },
  values: [{ type: String }],
  organizationId: { type: String, required: true },
}, { timestamps: true });

export const MasterData = mongoose.models.MasterData ?? mongoose.model<IMasterData>("MasterData", MasterDataSchema);
