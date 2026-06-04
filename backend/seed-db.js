/**
 * MongoDB Seed Script
 * Seeds the production database with initial data after cleanup.
 * Run with: node /home/j0k3r/Desktop/workspaces/backend/seed-db.js
 */
require('dotenv/config');
const mongoose = require('mongoose');
const Organization = require('./models/index.js').Organization;
const UserProfile = require('./models/index.js').UserProfile;
const OrgMember = require('./models/index.js').OrgMember;

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  
  const now = new Date().toISOString();
  const orgId = require('crypto').randomUUID();
  const userId = require('crypto').randomUUID();
  
  // 1. Create default organization
  await Organization.create({
    _id: orgId,
    name: 'MyEnum',
    category: 'Technology',
    companyRange: '1-10',
    email: 'developer@myenum.in',
    ownerEmail: 'developer@myenum.in',
    ownerId: userId,
    logoUrl: '',
    industry: 'Technology',
    size: '1-10',
    status: 'active',
    settings: {},
    hrSettings: {},
    themeSettings: {},
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });
  console.log('✓ Created organization: MyEnum');
  
  // 2. Create default admin user profile
  const bcrypt = require('bcryptjs');
  const passwordHash = await bcrypt.hash('Myenum2412', 12);
  
  await UserProfile.create({
    _id: userId,
    organizationId: orgId,
    workspaceId: null,
    userId: userId,
    firstName: 'Developer',
    lastName: 'Admin',
    email: 'developer@myenum.in',
    passwordHash,
    phone: '',
    designation: 'System Administrator',
    department: 'Engineering',
    avatarUrl: '',
    bio: '',
    expertise: [],
    empId: 'EMP-ADMIN-001',
    joiningDate: now,
    employmentType: 'full_time',
    status: 'active',
    terminationDate: null,
    terminationReason: null,
    lastLogin: null,
    loginCount: 0,
    emailVerified: true,
    teamIds: [],
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });
  console.log('✓ Created admin user: developer@myenum.in');
  
  // 3. Create org member record
  await OrgMember.create({
    _id: require('crypto').randomUUID(),
    organizationId: orgId,
    workspaceId: null,
    userId: userId,
    role: 'ORG_ADMIN',
    status: 'active',
    invitedBy: '',
    joinedAt: now,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });
  console.log('✓ Created org member record with ORG_ADMIN role');
  
  console.log('\n✓ Database seeded successfully!');
  console.log('  Email: developer@myenum.in');
  console.log('  Password: Myenum2412');
  
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
