export type OrgRole = 'owner' | 'admin' | 'manager' | 'staff' | string;
export type MemberStatus = 'active' | 'inactive' | 'pending' | string;

export interface BaseDoc {
  $id: string;
  $createdAt?: string;
  $updatedAt?: string;
  type?: string;
  organizationId?: string;
}

export interface Organization extends BaseDoc {
  name: string;
  category?: string;
  email?: string;
  ownerEmail?: string;
  ownerId?: string;
  logoUrl?: string;
  industry?: string;
  size?: string;
  settings?: string;
  createdAt?: string;
}

export interface UserProfile extends BaseDoc {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  designation?: string;
  department?: string;
  avatarUrl?: string;
  bio?: string;
  expertise?: string[];
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
}

export interface OrgMember extends BaseDoc {
  userId: string;
  role: OrgRole;
  status: MemberStatus;
  invitedBy?: string;
  joinedAt?: string;
}

export interface OrgInvitation extends BaseDoc {
  email: string;
  role: string;
  invitedBy: string;
  token: string;
  status: string;
  expiresAt: string;
}

export interface ClientDoc extends BaseDoc {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  status: string;
  industry?: string;
  location?: string;
  logoId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskDoc extends BaseDoc {
  taskNo: string;
  task: string;
  assignedTo: string;
  delegatedBy: string;
  delegatedStatus: string;
  delegationVerification: string;
  status: string;
  priority: string;
  dueDate: string;
  taskVerificationStatus: string;
  finalStatus: string;
}

export interface TeamDoc extends BaseDoc {
  name: string;
  head: string;
  members: number;
  projects: number;
  status: string;
}

export interface BranchDoc extends BaseDoc {
  name: string;
  address?: string;
  managerName?: string;
  status: string;
}

export interface SavedTaskDoc extends BaseDoc {
  title: string;
  description: string;
  priority: string;
  taskType: string;
  assignedType: string;
  estimatedTime: string;
  templateCategory: string;
}

export interface MasterDataDoc extends BaseDoc {
  name: string;
  values: string[];
}

export interface AuthSession {
  user: {
    $id: string;
    $createdAt?: string;
    $updatedAt?: string;
    name: string;
    email: string;
    emailVerification: boolean;
    phone: string;
    phoneVerification: boolean;
    status: boolean;
    prefs: Record<string, unknown>;
    registration: string;
    labels: string[];
    accessedAt: string;
  };
  profile: UserProfile | null;
  organization: Organization | null;
  membership: OrgMember | null;
}
