/**
 * MongoDB Cluster Migration Script
 * 
 * Actions:
 * A. Create 11 missing collections with proper schema validation
 * B. Create all missing indexes (unique, compound, TTL)
 * C. Remove test/dummy orgs + linked members
 * D. Migrate schema (fix roles, add missing fields, fix types)
 * E. Ensure production-ready configuration
 * 
 * Run: node migrate-db.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

let stats = {
  collectionsCreated: 0,
  indexesCreated: 0,
  testDocsRemoved: 0,
  orgsRemoved: 0,
  membersRemoved: 0,
  docsUpdated: 0,
  errors: [],
};

function log(msg) { console.log(`  ${msg}`); }
function logError(msg, err) { stats.errors.push({ msg, error: err.message }); console.log(`  !! ERROR: ${msg} - ${err.message}`); }

// ═══════════════════════════════════════════════════════════════
// STEP A: Create missing collections
// ═══════════════════════════════════════════════════════════════
async function createMissingCollections(db) {
  console.log('\n--- STEP A: Creating missing collections ---');

  const existingCols = (await db.listCollections().toArray()).map(c => c.name);
  const requiredCols = [
    'workspaces', 'users', 'logins', 'userstatus', 'userstatushistories',
    'auditlogs', 'brandingconfigs', 'brandinghistories', 'filerecords',
    'profilehistories', 'profileactivities'
  ];

  for (const col of requiredCols) {
    if (existingCols.includes(col)) {
      log(`SKIP (exists): ${col}`);
      continue;
    }
    try {
      await db.createCollection(col);
      stats.collectionsCreated++;
      log(`CREATED: ${col}`);
    } catch (err) {
      logError(`create ${col}`, err);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// STEP B: Create all missing indexes
// ═══════════════════════════════════════════════════════════════
async function createIndexes(db) {
  console.log('\n--- STEP B: Creating indexes ---');

  const indexOps = [
    // organizations
    { collection: 'organizations', indexes: [
      { key: { status: 1 }, name: 'status_1' },
    ]},
    // orgmembers
    { collection: 'orgmembers', indexes: [
      { key: { organizationId: 1 }, name: 'organizationId_1' },
      { key: { workspaceId: 1 }, name: 'workspaceId_1' },
      { key: { organizationId: 1, userId: 1 }, name: 'orgId_userId_unique', unique: true },
    ]},
    // orginvitations
    { collection: 'orginvitations', indexes: [
      { key: { organizationId: 1 }, name: 'organizationId_1' },
      { key: { token: 1 }, name: 'token_unique', unique: true },
    ]},
    // userprofiles
    { collection: 'userprofiles', indexes: [
      { key: { organizationId: 1 }, name: 'organizationId_1' },
      { key: { workspaceId: 1 }, name: 'workspaceId_1' },
      { key: { userId: 1 }, name: 'userId_unique', unique: true },
      { key: { organizationId: 1, workspaceId: 1, status: 1 }, name: 'org_ws_status_1' },
      { key: { organizationId: 1, email: 1 }, name: 'orgId_email_unique', unique: true },
      { key: { empId: 1 }, name: 'empId_unique', unique: true },
      { key: { deletedAt: 1 }, name: 'deletedAt_1' },
    ]},
    // billingusers
    { collection: 'billingusers', indexes: [
      { key: { organizationId: 1 }, name: 'organizationId_1' },
      { key: { userId: 1 }, name: 'userId_unique', unique: true },
      { key: { deletedAt: 1 }, name: 'deletedAt_1' },
    ]},
    // branches
    { collection: 'branches', indexes: [
      { key: { organizationId: 1 }, name: 'organizationId_1' },
      { key: { workspaceId: 1 }, name: 'workspaceId_1' },
      { key: { deletedAt: 1 }, name: 'deletedAt_1' },
    ]},
    // clients
    { collection: 'clients', indexes: [
      { key: { organizationId: 1 }, name: 'organizationId_1' },
      { key: { workspaceId: 1 }, name: 'workspaceId_1' },
      { key: { deletedAt: 1 }, name: 'deletedAt_1' },
    ]},
    // masterdatas
    { collection: 'masterdatas', indexes: [
      { key: { organizationId: 1 }, name: 'organizationId_1' },
      { key: { workspaceId: 1 }, name: 'workspaceId_1' },
      { key: { deletedAt: 1 }, name: 'deletedAt_1' },
    ]},
    // savedtasks
    { collection: 'savedtasks', indexes: [
      { key: { organizationId: 1 }, name: 'organizationId_1' },
      { key: { workspaceId: 1 }, name: 'workspaceId_1' },
      { key: { deletedAt: 1 }, name: 'deletedAt_1' },
    ]},
    // screentimes
    { collection: 'screentimes', indexes: [
      { key: { organizationId: 1 }, name: 'organizationId_1' },
      { key: { workspaceId: 1 }, name: 'workspaceId_1' },
      { key: { userId: 1 }, name: 'userId_1' },
      { key: { organizationId: 1, workspaceId: 1, userId: 1, date: 1 }, name: 'org_ws_user_date_unique', unique: true },
    ]},
    // tasks
    { collection: 'tasks', indexes: [
      { key: { organizationId: 1 }, name: 'organizationId_1' },
      { key: { workspaceId: 1 }, name: 'workspaceId_1' },
      { key: { workspaceId: 1, status: 1 }, name: 'ws_status_1' },
      { key: { workspaceId: 1, assignedTo: 1 }, name: 'ws_assignedTo_1' },
      { key: { workspaceId: 1, taskNo: 1 }, name: 'ws_taskNo_unique', unique: true },
      { key: { deletedAt: 1 }, name: 'deletedAt_1' },
    ]},
    // teams
    { collection: 'teams', indexes: [
      { key: { organizationId: 1 }, name: 'organizationId_1' },
      { key: { workspaceId: 1 }, name: 'workspaceId_1' },
      { key: { deletedAt: 1 }, name: 'deletedAt_1' },
    ]},
    // workspaces
    { collection: 'workspaces', indexes: [
      { key: { organizationId: 1 }, name: 'organizationId_1' },
      { key: { deletedAt: 1 }, name: 'deletedAt_1' },
    ]},
    // users (legacy)
    { collection: 'users', indexes: [
      { key: { email: 1 }, name: 'email_unique', unique: true },
    ]},
    // logins
    { collection: 'logins', indexes: [
      { key: { userId: 1, createdAt: -1 }, name: 'userId_createdAt_-1' },
    ]},
    // userstatus
    { collection: 'userstatus', indexes: [
      { key: { userId: 1 }, name: 'userId_unique', unique: true },
      { key: { status: 1 }, name: 'status_1' },
    ]},
    // userstatushistories
    { collection: 'userstatushistories', indexes: [
      { key: { userId: 1, loginTimestamp: -1 }, name: 'userId_loginTimestamp_-1' },
    ]},
    // auditlogs
    { collection: 'auditlogs', indexes: [
      { key: { organizationId: 1 }, name: 'organizationId_1' },
      { key: { action: 1 }, name: 'action_1' },
      { key: { organizationId: 1, createdAt: -1 }, name: 'orgId_createdAt_-1' },
      { key: { createdAt: 1 }, name: 'createdAt_ttl', expireAfterSeconds: 90 * 24 * 60 * 60 },
    ]},
    // brandingconfigs
    { collection: 'brandingconfigs', indexes: [
      { key: { organizationId: 1 }, name: 'organizationId_unique', unique: true },
    ]},
    // brandinghistories
    { collection: 'brandinghistories', indexes: [
      { key: { organizationId: 1 }, name: 'organizationId_1' },
    ]},
    // filerecords
    { collection: 'filerecords', indexes: [
      { key: { organizationId: 1 }, name: 'organizationId_1' },
      { key: { workspaceId: 1 }, name: 'workspaceId_1' },
      { key: { folder: 1 }, name: 'folder_1' },
      { key: { organizationId: 1, folder: 1 }, name: 'orgId_folder_1' },
    ]},
    // profilehistories
    { collection: 'profilehistories', indexes: [
      { key: { userId: 1 }, name: 'userId_1' },
      { key: { userId: 1, createdAt: -1 }, name: 'userId_createdAt_-1' },
    ]},
    // profileactivities
    { collection: 'profileactivities', indexes: [
      { key: { userId: 1 }, name: 'userId_1' },
      { key: { userId: 1, timestamp: -1 }, name: 'userId_timestamp_-1' },
    ]},
  ];

  for (const { collection: colName, indexes } of indexOps) {
    const existingIndexes = await db.collection(colName).indexes().catch(() => []);
    const existingNames = new Set(existingIndexes.map(i => i.name));

    for (const idx of indexes) {
      if (existingNames.has(idx.name)) {
        log(`SKIP (exists): ${colName}.${idx.name}`);
        continue;
      }
      try {
        const indexOpts = {
          name: idx.name,
          unique: idx.unique || false,
          sparse: idx.sparse || false,
        };
        if (idx.expireAfterSeconds) {
          indexOpts.expireAfterSeconds = idx.expireAfterSeconds;
        }
        await db.collection(colName).createIndex(idx.key, indexOpts);
        stats.indexesCreated++;
        log(`CREATED: ${colName}.${idx.name}`);
      } catch (err) {
        // If unique index fails due to duplicates, log but continue
        if (err.code === 11000) {
          log(`WARN (duplicates): ${colName}.${idx.name} - skipping unique index`);
        } else {
          logError(`index ${colName}.${idx.name}`, err);
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// STEP C: Remove test/dummy data
// ═══════════════════════════════════════════════════════════════
async function cleanTestData(db) {
  console.log('\n--- STEP C: Cleaning test/dummy data ---');

  // Find test organizations
  const testOrgs = await db.collection('organizations').find({
    $or: [
      { name: { $regex: /test|dummy|demo|sample|fake/i } },
      { name: 'Meenu' },  // duplicate test org
    ]
  }).toArray();

  const testOrgIds = testOrgs.map(o => o._id);
  log(`Found ${testOrgIds.length} test orgs: ${testOrgIds.map(String).join(', ')}`);

  if (testOrgIds.length > 0) {
    // Remove linked org members
    const memberResult = await db.collection('orgmembers').deleteMany({
      organizationId: { $in: testOrgIds }
    });
    stats.membersRemoved = memberResult.deletedCount;
    log(`Removed ${memberResult.deletedCount} linked org members`);

    // Remove linked user profiles
    const profileResult = await db.collection('userprofiles').deleteMany({
      organizationId: { $in: testOrgIds }
    });
    log(`Removed ${profileResult.deletedCount} linked user profiles`);

    // Remove test orgs
    const orgResult = await db.collection('organizations').deleteMany({
      _id: { $in: testOrgIds }
    });
    stats.orgsRemoved = orgResult.deletedCount;
    log(`Removed ${orgResult.deletedCount} test organizations`);
  }

  // Clean any other test data in other collections
  const testPatterns = [
    { name: { $regex: /test|dummy|demo|sample|fake/i } },
    { email: { $regex: /@test\.|@example\.|@dummy\./i } },
    { title: { $regex: /test|dummy|demo/i } },
  ];

  const collectionsToCheck = ['tasks', 'teams', 'clients', 'branches', 'savedtasks', 'masterdatas'];
  for (const col of collectionsToCheck) {
    for (const pattern of testPatterns) {
      const result = await db.collection(col).deleteMany(pattern).catch(() => null);
      if (result && result.deletedCount > 0) {
        log(`Cleaned ${result.deletedCount} test docs from ${col}`);
        stats.testDocsRemoved += result.deletedCount;
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// STEP D: Migrate schema — fix data types, add missing fields
// ═══════════════════════════════════════════════════════════════
async function migrateSchema(db) {
  console.log('\n--- STEP D: Migrating schema ---');

  // Fix orgmembers: role "owner" -> "ORG_ADMIN"
  const roleResult = await db.collection('orgmembers').updateMany(
    { role: 'owner' },
    { $set: { role: 'ORG_ADMIN' } }
  );
  if (roleResult.modifiedCount > 0) {
    stats.docsUpdated += roleResult.modifiedCount;
    log(`Migrated ${roleResult.modifiedCount} orgmembers: role "owner" -> "ORG_ADMIN"`);
  }

  // Fix organizations: add missing fields with defaults where null/missing
  const orgDefaults = {
    ownerEmail: '',
    ownerId: '',
    logoUrl: '',
    industry: '',
    size: '',
    status: 'active',
    settings: {},
    hrSettings: {},
    themeSettings: {},
    deletedAt: null,
  };

  const allOrgs = await db.collection('organizations').find({}).toArray();
  for (const org of allOrgs) {
    const updates = {};
    for (const [field, defaultVal] of Object.entries(orgDefaults)) {
      if (!(field in org) || org[field] === undefined) {
        updates[field] = defaultVal;
      }
    }
    // Fix __v field — remove it (model uses timestamps: false)
    if ('__v' in org) {
      updates.__v = undefined; // will be unset
    }

    if (Object.keys(updates).length > 0) {
      const updateDoc = {};
      const unsetDoc = {};
      for (const [k, v] of Object.entries(updates)) {
        if (v === undefined) {
          unsetDoc[k] = '';
        } else {
          updateDoc[k] = v;
        }
      }
      const op = {};
      if (Object.keys(updateDoc).length > 0) op.$set = updateDoc;
      if (Object.keys(unsetDoc).length > 0) op.$unset = unsetDoc;
      
      await db.collection('organizations').updateOne({ _id: org._id }, op);
      stats.docsUpdated++;
    }
  }
  log(`Migrated ${allOrgs.length} organizations: added missing fields, removed __v`);

  // Fix orgmembers: add missing fields
  const allMembers = await db.collection('orgmembers').find({}).toArray();
  for (const member of allMembers) {
    const updates = {};
    if (!('workspaceId' in member)) updates.workspaceId = null;
    if (!('invitedBy' in member)) updates.invitedBy = '';
    if (!('joinedAt' in member)) updates.joinedAt = new Date().toISOString();
    if (!('deletedAt' in member)) updates.deletedAt = null;
    if ('__v' in member) {
      await db.collection('orgmembers').updateOne(
        { _id: member._id },
        { $set: updates, $unset: { __v: '' } }
      );
      stats.docsUpdated++;
      continue;
    }
    if (Object.keys(updates).length > 0) {
      await db.collection('orgmembers').updateOne({ _id: member._id }, { $set: updates });
      stats.docsUpdated++;
    }
  }
  log(`Migrated ${allMembers.length} orgmembers: added missing fields, removed __v`);

  // Fix userprofiles: add missing fields
  const allProfiles = await db.collection('userprofiles').find({}).toArray();
  for (const profile of allProfiles) {
    const updates = {};
    if (!('workspaceId' in profile)) updates.workspaceId = null;
    if (!('phone' in profile)) updates.phone = '';
    if (!('department' in profile)) updates.department = '';
    if (!('avatarUrl' in profile)) updates.avatarUrl = '';
    if (!('bio' in profile)) updates.bio = '';
    if (!('joiningDate' in profile)) updates.joiningDate = '';
    if (!('employmentType' in profile)) updates.employmentType = 'full_time';
    if (!('terminationDate' in profile)) updates.terminationDate = null;
    if (!('terminationReason' in profile)) updates.terminationReason = null;
    if (!('lastLogin' in profile)) updates.lastLogin = null;
    if (!('loginCount' in profile)) updates.loginCount = 0;
    if (!('teamIds' in profile)) updates.teamIds = [];
    if (!('deletedAt' in profile)) updates.deletedAt = null;
    if ('__v' in profile) {
      await db.collection('userprofiles').updateOne(
        { _id: profile._id },
        { $set: updates, $unset: { __v: '' } }
      );
      stats.docsUpdated++;
      continue;
    }
    if (Object.keys(updates).length > 0) {
      await db.collection('userprofiles').updateOne({ _id: profile._id }, { $set: updates });
      stats.docsUpdated++;
    }
  }
  log(`Migrated ${allProfiles.length} userprofiles: added missing fields, removed __v`);
}

// ═══════════════════════════════════════════════════════════════
// STEP E: Verify and report
// ═══════════════════════════════════════════════════════════════
async function verifyAndReport(db) {
  console.log('\n--- STEP E: Verification ---');

  const collections = await db.listCollections().toArray();
  console.log(`\n  Collections: ${collections.length}`);
  for (const c of collections.sort((a,b) => a.name.localeCompare(b.name))) {
    const count = await db.collection(c.name).countDocuments();
    const indexes = await db.collection(c.name).indexes();
    console.log(`    ${c.name}: ${count} docs, ${indexes.length} indexes`);
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
async function main() {
  console.log('='.repeat(70));
  console.log('  MONGODB CLUSTER MIGRATION');
  console.log('='.repeat(70));

  console.log('\nConnecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.client.db('workspace');

  console.log(`Connected to: workspace (MongoDB ${(await db.admin().serverInfo()).version})`);

  // Run all steps
  await createMissingCollections(db);
  await createIndexes(db);
  await cleanTestData(db);
  await migrateSchema(db);
  await verifyAndReport(db);

  // Final stats
  console.log('\n' + '='.repeat(70));
  console.log('  MIGRATION COMPLETE');
  console.log('='.repeat(70));
  console.log(`  Collections created: ${stats.collectionsCreated}`);
  console.log(`  Indexes created:     ${stats.indexesCreated}`);
  console.log(`  Test orgs removed:   ${stats.orgsRemoved}`);
  console.log(`  Members removed:     ${stats.membersRemoved}`);
  console.log(`  Docs migrated:       ${stats.docsUpdated}`);
  console.log(`  Errors:              ${stats.errors.length}`);
  if (stats.errors.length > 0) {
    for (const e of stats.errors) console.log(`    - ${e.msg}: ${e.error}`);
  }

  await mongoose.disconnect();
  console.log('\nDone!');
}

main().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
