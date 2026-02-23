/**
 * MongoDB Validation Script
 * Verifies all collections exist and contain proper data structure
 * 
 * Run with: node validate-mongodb.js
 */

const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.vgn0xjv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function validateCollection(db, collectionName, requiredFields = []) {
  log(`\n📋 Validating Collection: ${collectionName}`, 'cyan');
  
  try {
    const collection = db.collection(collectionName);
    const count = await collection.countDocuments();
    
    if (count === 0) {
      log(`  ⚠️  Collection is empty (${count} documents)`, 'yellow');
      return { name: collectionName, count, status: 'empty', fields: [] };
    }

    const sample = await collection.findOne();
    const fields = sample ? Object.keys(sample) : [];

    log(`  ✓ Documents found: ${count}`, 'green');
    log(`  ✓ Sample document ID: ${sample._id}`, 'green');
    log(`  ✓ Fields: ${fields.join(', ')}`, 'green');

    // Check for required fields
    let missingFields = [];
    for (const field of requiredFields) {
      if (!fields.includes(field)) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      log(`  ⚠️  Missing required fields: ${missingFields.join(', ')}`, 'yellow');
      return { name: collectionName, count, status: 'incomplete', fields, missingFields };
    }

    return { name: collectionName, count, status: 'valid', fields };
  } catch (error) {
    log(`  ✗ Error: ${error.message}`, 'red');
    return { name: collectionName, status: 'error', error: error.message };
  }
}

async function validateIndexes(db) {
  log('\n🔑 Validating Indexes', 'cyan');
  
  try {
    const usersCollection = db.collection('users');
    const indexes = await usersCollection.listIndexes().toArray();
    
    log(`  ✓ Indexes found: ${indexes.length}`, 'green');
    indexes.forEach(index => {
      log(`    - ${JSON.stringify(index.key)}`, 'green');
    });

    return true;
  } catch (error) {
    log(`  ✗ Error checking indexes: ${error.message}`, 'red');
    return false;
  }
}

async function validateDataStructure(db) {
  log('\n📊 Validating Data Structure', 'cyan');

  try {
    // Check users collection
    const userSample = await db.collection('users').findOne();
    if (userSample) {
      log(`  ✓ User sample structure:`, 'green');
      log(`    - _id: ${typeof userSample._id}`, 'blue');
      log(`    - name: ${typeof userSample.name}`, 'blue');
      log(`    - email: ${typeof userSample.email} (${userSample.email})`, 'blue');
      log(`    - password: ${typeof userSample.password} (hashed: length ${userSample.password?.length || 0})`, 'blue');
    }

    // Check jobs collection
    const jobSample = await db.collection('demoJobs').findOne();
    if (jobSample) {
      log(`  ✓ Job sample structure:`, 'green');
      log(`    - _id: ${typeof jobSample._id}`, 'blue');
      log(`    - jobTitle: ${jobSample.jobTitle}`, 'blue');
      log(`    - companyName: ${jobSample.companyName}`, 'blue');
      log(`    - postedBy: ${jobSample.postedBy}`, 'blue');
    }

    // Check applications collection
    const appSample = await db.collection('applications').findOne();
    if (appSample) {
      log(`  ✓ Application sample structure:`, 'green');
      log(`    - _id: ${typeof appSample._id}`, 'blue');
      log(`    - jobId: ${typeof appSample.jobId}`, 'blue');
      log(`    - seekerEmail: ${appSample.seekerEmail}`, 'blue');
      log(`    - status: ${appSample.status}`, 'blue');
    }

    return true;
  } catch (error) {
    log(`  ✗ Error validating structure: ${error.message}`, 'red');
    return false;
  }
}

async function checkDatabaseStats(db) {
  log('\n📈 Database Statistics', 'cyan');

  try {
    const collections = ['users', 'companies', 'demoJobs', 'applications', 'savedJobs', 'reviews'];
    const stats = {};

    for (const colName of collections) {
      const col = db.collection(colName);
      const count = await col.countDocuments();
      stats[colName] = count;
    }

    log(`  ✓ Users: ${stats.users || 0}`, stats.users > 0 ? 'green' : 'yellow');
    log(`  ✓ Companies: ${stats.companies || 0}`, stats.companies > 0 ? 'green' : 'yellow');
    log(`  ✓ Jobs: ${stats.demoJobs || 0}`, stats.demoJobs > 0 ? 'green' : 'yellow');
    log(`  ✓ Applications: ${stats.applications || 0}`, stats.applications > 0 ? 'green' : 'yellow');
    log(`  ✓ Saved Jobs: ${stats.savedJobs || 0}`, stats.savedJobs >= 0 ? 'green' : 'yellow');
    log(`  ✓ Reviews: ${stats.reviews || 0}`, stats.reviews >= 0 ? 'green' : 'yellow');

    return stats;
  } catch (error) {
    log(`  ✗ Error getting stats: ${error.message}`, 'red');
    return null;
  }
}

async function validateConnections(db) {
  log('\n🔏 Validating Data Relationships', 'cyan');

  try {
    const applications = await db.collection('applications').find({}).limit(1).toArray();
    
    if (applications.length > 0) {
      const app = applications[0];
      log(`  ✓ Sample application:`, 'green');
      log(`    - jobId: ${app.jobId}`, 'blue');
      log(`    - seekerEmail: ${app.seekerEmail}`, 'blue');
      
      // Verify job exists
      const { ObjectId } = require('mongodb');
      try {
        const job = await db.collection('demoJobs').findOne({ _id: new ObjectId(app.jobId) });
        if (job) {
          log(`    - Linked job found: ${job.jobTitle}`, 'green');
        } else {
          log(`    - Linked job NOT found (dangling reference)`, 'yellow');
        }
      } catch (e) {
        log(`    - Could not verify job link: ${e.message}`, 'yellow');
      }

      // Verify seeker exists
      const seeker = await db.collection('users').findOne({ email: app.seekerEmail });
      if (seeker) {
        log(`    - Linked user found: ${seeker.name || seeker.email}`, 'green');
      } else {
        log(`    - Linked user NOT found (dangling reference)`, 'yellow');
      }
    } else {
      log(`  ℹ️  No applications yet (will verify after tests)`, 'cyan');
    }

    return true;
  } catch (error) {
    log(`  ✗ Error checking relationships: ${error.message}`, 'red');
    return false;
  }
}

async function validateSecurity(db) {
  log('\n🔐 Validating Security', 'cyan');

  try {
    // Check if passwords are hashed (should start with $ for bcrypt)
    const user = await db.collection('users').findOne();
    if (user && user.password) {
      const isHashed = user.password.startsWith('$2') || user.password.startsWith('$') && user.password.length > 30;
      if (isHashed) {
        log(`  ✓ Passwords are properly hashed (bcrypt)`, 'green');
        log(`    - Sample hash length: ${user.password.length}`, 'blue');
      } else {
        log(`  ✗ WARNING: Passwords may not be properly hashed!`, 'red');
      }
    }

    // Check for email uniqueness constraint
    const users = await db.collection('users').find({}).toArray();
    const emails = users.map(u => u.email);
    const uniqueEmails = new Set(emails);
    
    if (emails.length === uniqueEmails.size) {
      log(`  ✓ Email uniqueness verified`, 'green');
    } else {
      log(`  ✗ WARNING: Duplicate emails found!`, 'red');
    }

    return true;
  } catch (error) {
    log(`  ✗ Error checking security: ${error.message}`, 'red');
    return false;
  }
}

async function runValidation() {
  log('\n' + '='.repeat(60), 'magenta');
  log('🗄️  MONGODB VALIDATION REPORT', 'magenta');
  log('='.repeat(60), 'magenta');

  try {
    await client.connect();
    log('\n✓ Connected to MongoDB', 'green');

    const db = client.db('mernJobPortal');

    // Validate collections
    const collectionSpecs = [
      { name: 'users', fields: ['email', 'password', 'name'] },
      { name: 'companies', fields: ['email', 'password', 'companyName'] },
      { name: 'demoJobs', fields: ['jobTitle', 'companyName', 'postedBy'] },
      { name: 'applications', fields: ['jobId', 'seekerEmail', 'status'] },
      { name: 'savedJobs', fields: ['jobId', 'seekerEmail'] },
      { name: 'reviews', fields: ['companyEmail', 'rating', 'comment'] }
    ];

    const validationResults = [];
    for (const spec of collectionSpecs) {
      const result = await validateCollection(db, spec.name, spec.fields);
      validationResults.push(result);
    }

    // Additional validations
    await validateIndexes(db);
    await validateDataStructure(db);
    const stats = await checkDatabaseStats(db);
    await validateConnections(db);
    await validateSecurity(db);

    // Summary
    log('\n' + '='.repeat(60), 'magenta');
    log('📋 VALIDATION SUMMARY', 'magenta');
    log('='.repeat(60), 'magenta');

    let allValid = true;
    validationResults.forEach(result => {
      const statusIcon = result.status === 'valid' ? '✓' : result.status === 'empty' ? '⚠️' : '✗';
      const color = result.status === 'valid' ? 'green' : result.status === 'empty' ? 'yellow' : 'red';
      log(`  ${statusIcon} ${result.name}: ${result.count || 0} documents (${result.status})`, color);
      if (result.status !== 'valid') allValid = false;
    });

    log('='.repeat(60), 'magenta');

    if (allValid && stats && stats.users > 0) {
      log('\n✅ MongoDB validation PASSED!', 'green');
      log('   All collections are properly structured and contain data.', 'green');
    } else if (!allValid) {
      log('\n⚠️  MongoDB validation INCOMPLETE', 'yellow');
      log('   Some collections may be empty. Run test-all-features.js first.', 'yellow');
    } else {
      log('\n✗ MongoDB validation FAILED', 'red');
      log('   Check errors above and verify MongoDB connection.', 'red');
    }

  } catch (error) {
    log(`\n✗ Fatal Error: ${error.message}`, 'red');
    log('   Verify MongoDB connection and credentials in .env', 'red');
  } finally {
    await client.close();
    log('\n✓ Disconnected from MongoDB', 'cyan');
    process.exit(0);
  }
}

// Run validation
runValidation();
