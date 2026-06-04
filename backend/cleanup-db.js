/**
 * MongoDB Database Cleanup Script
 * 
 * Drops all collections NOT in the 13 production list.
 * Cleans all test/dummy data from production collections.
 * 
 * Run with: node /home/j0k3r/Desktop/workspaces/backend/cleanup-db.js
 * (requires MongoDB running and MONGODB_URI in .env)
 */
require('dotenv/config');
const mongoose = require('mongoose');

const PRODUCTION_COLLECTIONS = new Set([
  'organizations',
  'orgmembers',
  'orginvitations',
  'userprofiles',
  'billingusers',
  'branches',
  'clients',
  'masterdatas',
  'savedtasks',
  'screentimes',
  'tasks',
  'teams',
  'workspaces',
]);

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const collections = await db.listCollections().toArray();
  console.log(`\nFound ${collections.length} collections\n`);

  let dropped = 0;
  let cleaned = 0;

  for (const c of collections) {
    const name = c.name;
    const isProduction = PRODUCTION_COLLECTIONS.has(name);

    if (!isProduction) {
      // Drop non-production collections entirely
      try {
        await db.dropCollection(name);
        dropped++;
        console.log(`  ✗ DROPPED: ${name}`);
      } catch (err) {
        console.log(`  ✗ DROP FAILED: ${name} (${err.message})`);
      }
    } else {
      // Clean all data from production collections
      try {
        const result = await db.collection(name).deleteMany({});
        cleaned++;
        console.log(`  ✓ CLEANED: ${name} (${result.deletedCount} documents removed)`);
      } catch (err) {
        console.log(`  ✓ CLEAN FAILED: ${name} (${err.message})`);
      }
    }
  }

  console.log(`\n=== RESULT ===`);
  console.log(`  Dropped: ${dropped} non-production collections`);
  console.log(`  Cleaned: ${cleaned} production collections`);

  const final = await db.listCollections().toArray();
  console.log(`\n  Final database has ${final.length} collections:`);
  for (const c of final.sort((a, b) => a.name.localeCompare(b.name))) {
    const count = await db.collection(c.name).countDocuments();
    console.log(`    ${c.name}: ${count} documents`);
  }

  await mongoose.disconnect();
  console.log('\nDatabase cleanup complete!');
}

main().catch(err => {
  console.error('Cleanup failed:', err.message);
  process.exit(1);
});
