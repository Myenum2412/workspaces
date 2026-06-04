/**
 * MongoDB Cluster Analysis Script v2
 * Discovers all databases, collections, schemas, indexes, and data quality.
 */
require('dotenv').config();
const mongoose = require('mongoose');

const TEST_DUMMY_PATTERNS = [
  /test/i, /dummy/i, /demo/i, /sample/i, /fake/i,
  /asdf/i, /qwerty/i, /lorem/i, /ipsum/i,
  /xxxx/i, /yyyy/i, /zzzz/i,
  /^test_/, /^dummy_/, /^demo_/,
  /@test\./, /@example\./, /@dummy\./,
  /temp/i, /tmp/i, /delete/i, /remove/i,
  /admin@admin/i, /user@user/i, /foo@bar/i,
];

function looksLikeTestDoc(doc) {
  const str = JSON.stringify(doc);
  for (const pattern of TEST_DUMMY_PATTERNS) {
    if (pattern.test(str)) return true;
  }
  const keys = Object.keys(doc).filter(k => !['_id','createdAt','updatedAt','deletedAt'].includes(k));
  if (keys.length === 0) return true;
  const allEmpty = keys.every(k => {
    const v = doc[k];
    return v === '' || v === null || v === undefined || v === 0 || v === false ||
      (Array.isArray(v) && v.length === 0) ||
      (typeof v === 'object' && v !== null && Object.keys(v).length === 0);
  });
  return allEmpty;
}

async function analyzeCollection(db, name) {
  let stats = null;
  try { stats = await db.command({ collStats: name }); } catch(e) {}
  const count = await db.collection(name).countDocuments();
  let indexes = [];
  try { indexes = await db.collection(name).indexes(); } catch(e) {}
  const samples = await db.collection(name).find({}).limit(5).toArray();

  const schema = {};
  for (const doc of samples) {
    for (const [key, val] of Object.entries(doc)) {
      if (key === '_id') continue;
      const type = Array.isArray(val) ? 'Array' : val === null ? 'null' : typeof val;
      if (!schema[key]) schema[key] = { types: new Set(), sampleValues: [] };
      schema[key].types.add(type);
      if (schema[key].sampleValues.length < 3 && val != null) {
        schema[key].sampleValues.push(typeof val === 'object' ? JSON.stringify(val).substring(0,80) : String(val).substring(0,80));
      }
    }
  }

  const testDocIds = [];
  if (count > 0 && count <= 2000) {
    const allDocs = await db.collection(name).find({}).limit(500).toArray();
    for (const doc of allDocs) {
      if (looksLikeTestDoc(doc)) testDocIds.push(doc._id);
    }
  }

  const duplicateReport = [];
  const uniqueFields = ['email','userId','empId','token','taskNo','name','_id'];
  for (const field of uniqueFields) {
    if (samples.some(s => field in s)) {
      const dupes = await db.collection(name).aggregate([
        { $group: { _id: `$${field}`, count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 }, _id: { $ne: null, $ne: '' } } },
        { $limit: 5 }
      ]).toArray().catch(() => []);
      if (dupes.length > 0) duplicateReport.push({ field, duplicates: dupes });
    }
  }

  // Get a sample doc for display
  const sampleDoc = samples[0] || {};

  return {
    name, count,
    size: stats?.size || 0,
    storageSize: stats?.storageSize || 0,
    avgObjSize: stats?.avgObjSize || 0,
    indexes: indexes.map(i => ({ name: i.name, key: i.key, unique: i.unique || false, sparse: i.sparse || false })),
    schema: Object.fromEntries(Object.entries(schema).map(([k,v]) => [k, { types: [...v.types], sampleValues: v.sampleValues }])),
    testDocIds, testDocCount: testDocIds.length,
    duplicateReport, sampleCount: samples.length, sampleDoc
  };
}

async function main() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);

  const admin = mongoose.connection.db.admin();
  const serverInfo = await admin.serverInfo().catch(() => ({}));
  const dbList = await admin.listDatabases();

  console.log('\n' + '='.repeat(70));
  console.log('  MONGODB CLUSTER ANALYSIS REPORT');
  console.log('='.repeat(70));
  console.log(`\nServer: MongoDB ${serverInfo.version || 'unknown'}`);

  console.log(`\n--- DATABASES (${dbList.databases.length}) ---`);
  for (const d of dbList.databases) {
    console.log(`  ${d.name} (${(d.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
  }

  const allResults = [];
  for (const dbInfo of dbList.databases) {
    if (['admin','local','config'].includes(dbInfo.name)) continue;
    const db = mongoose.connection.client.db(dbInfo.name);
    const collections = await db.listCollections().toArray();

    console.log(`\n${'='.repeat(70)}`);
    console.log(`  DATABASE: ${dbInfo.name} (${collections.length} collections)`);
    console.log('='.repeat(70));

    for (const col of collections) {
      const a = await analyzeCollection(db, col.name);
      allResults.push({ db: dbInfo.name, ...a });

      console.log(`\n  [${col.name}]`);
      console.log(`    Documents: ${a.count} | Size: ${(a.size/1024).toFixed(1)} KB | AvgObj: ${a.avgObjSize.toFixed(0)} B`);
      console.log(`    Indexes (${a.indexes.length}):`);
      for (const idx of a.indexes) {
        const flags = [idx.unique?'UNIQUE':'', idx.sparse?'SPARSE':''].filter(Boolean).join('|');
        console.log(`      ${idx.name}: ${JSON.stringify(idx.key)}${flags?' ['+flags+']':''}`);
      }
      console.log(`    Schema (${Object.keys(a.schema)} fields):`);
      for (const [field, info] of Object.entries(a.schema)) {
        console.log(`      ${field}: ${info.types.join('|')}  ex: ${info.sampleValues[0]||'null'}`);
      }
      if (a.testDocCount > 0) {
        console.log(`    !! TEST/DUMMY docs: ${a.testDocCount} (IDs: ${a.testDocIds.slice(0,5).map(id=>String(id)).join(', ')}${a.testDocCount>5?'...':''})`);
      }
      if (a.duplicateReport.length > 0) {
        console.log(`    !! DUPLICATES:`);
        for (const d of a.duplicateReport) {
          console.log(`      field "${d.field}": ${d.duplicates.length} groups`);
          for (const g of d.duplicates.slice(0,3)) console.log(`        "${g._id}" x${g.count}`);
        }
      }
    }
  }

  // Full data dump for report
  console.log(`\n${'='.repeat(70)}`);
  console.log('  DATA PREVIEW (first 3 docs per collection)');
  console.log('='.repeat(70));
  for (const r of allResults) {
    if (r.count === 0) continue;
    const db = mongoose.connection.client.db(r.db);
    const docs = await db.collection(r.name).find({}).limit(3).toArray();
    console.log(`\n  ${r.db}.${r.name} (${r.count} docs):`);
    for (const doc of docs) {
      const preview = {};
      for (const [k,v] of Object.entries(doc)) {
        if (k === '_id') { preview._id = String(v); continue; }
        preview[k] = typeof v === 'object' ? JSON.stringify(v).substring(0,60) : String(v).substring(0,60);
      }
      console.log(`    ${JSON.stringify(preview)}`);
    }
  }

  // Summary
  console.log(`\n${'='.repeat(70)}`);
  console.log('  SUMMARY');
  console.log('='.repeat(70));
  const totalDocs = allResults.reduce((s,r) => s+r.count, 0);
  const totalTest = allResults.reduce((s,r) => s+r.testDocCount, 0);
  const totalDupes = allResults.reduce((s,r) => s+r.duplicateReport.length, 0);
  console.log(`  Collections analyzed: ${allResults.length}`);
  console.log(`  Total documents: ${totalDocs}`);
  console.log(`  Test/dummy documents: ${totalTest}`);
  console.log(`  Collections with duplicates: ${totalDupes}`);
  console.log(`  Empty collections: ${allResults.filter(r => r.count === 0).map(r=>r.name).join(', ') || 'none'}`);

  // Save report
  const fs = require('fs');
  const reportPath = '/home/j0k3r/Desktop/workspaces/backend/db-analysis-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(allResults.map(r => ({...r, testDocIds: r.testDocIds.map(String), sampleDoc: undefined})), null, 2));
  console.log(`\n  Report saved: ${reportPath}`);

  await mongoose.disconnect();
  console.log('\nDone!');
}

main().catch(err => { console.error('FAILED:', err.message); process.exit(1); });
