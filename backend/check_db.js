require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to:', mongoose.connection.name);
  console.log('Host:', mongoose.connection.host);

  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('\nCollections:', collections.map(c => c.name));

  // Check userprofiles
  const userProfiles = await mongoose.connection.collection('userprofiles').find({}).limit(5).toArray();
  console.log('\nUserProfiles count:', await mongoose.connection.collection('userprofiles').countDocuments({}));
  console.log('Sample userprofiles:', userProfiles.map(u => ({ email: u.email, firstName: u.firstName, organizationId: u.organizationId, deletedAt: u.deletedAt })));

  // Check staffs collection (if any legacy data)
  const staffCount = await mongoose.connection.collection('staffs').countDocuments({}).catch(() => 0);
  console.log('\nLegacy staffs collection count:', staffCount);

  // Check orgmembers
  const orgMembers = await mongoose.connection.collection('orgmembers').find({}).limit(5).toArray();
  console.log('OrgMembers count:', await mongoose.connection.collection('orgmembers').countDocuments({}));
  console.log('Sample orgmembers:', orgMembers.map(m => ({ userId: m.userId, organizationId: m.organizationId, role: m.role })));

  await mongoose.disconnect();
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
