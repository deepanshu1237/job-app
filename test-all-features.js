/**
 * Comprehensive Feature Test Suite for MERN Job Portal
 * Tests all features with data storage in MongoDB
 * 
 * Run with: node test-all-features.js
 */

const BASE_URL = 'http://localhost:3000';

// Test data
const testData = {
  seeker: {
    name: 'Test Seeker',
    email: `seeker-${Date.now()}@test.com`,
    mobile: '1234567890',
    password: 'Test@123'
  },
  company: {
    name: 'Test Company HR',
    email: `company-${Date.now()}@test.com`,
    companyName: 'Test Company Inc',
    password: 'Test@123'
  },
  job: {
    jobTitle: 'Senior React Developer',
    companyName: 'Tech Corp',
    minPrice: '5LPA',
    maxPrice: '15LPA',
    salaryType: 'Yearly',
    jobLocation: 'San Francisco',
    experienceLevel: 'Experienced',
    employmentType: 'Full-Time',
    skills: [{ label: 'React', value: 'react' }, { label: 'Node.js', value: 'nodejs' }],
    description: 'Looking for an experienced React developer with 5+ years of experience.'
  }
};

let tokens = {
  seeker: null,
  company: null
};

let ids = {
  jobId: null,
  applicationId: null,
  interviewId: null
};

// Utility function for API calls
async function apiCall(method, endpoint, body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    return { ok: false, status: 0, data: { error: error.message } };
  }
}

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed) {
  const status = passed ? `${colors.green}✓ PASSED${colors.reset}` : `${colors.red}✗ FAILED${colors.reset}`;
  console.log(`  ${status}  ${name}`);
}

// Test functions
async function testSeekerSignup() {
  log('\n📝 Test 1: Seeker Signup', 'cyan');
  const result = await apiCall('POST', '/signup', testData.seeker);
  logTest('Seeker signup', result.ok);
  if (!result.ok) log(`  Error: ${result.data.error}`, 'red');
  return result.ok;
}

async function testSeekerLogin() {
  log('\n🔐 Test 2: Seeker Login', 'cyan');
  const loginData = {
    email: testData.seeker.email,
    password: testData.seeker.password
  };
  const result = await apiCall('POST', '/login', loginData);
  logTest('Seeker login', result.ok);
  if (result.ok) {
    tokens.seeker = result.data.token?.replace(/^"|"$/g, '').trim();
    log(`  Token obtained: ${tokens.seeker ? '✓' : '✗'}`, tokens.seeker ? 'green' : 'red');
  } else {
    log(`  Error: ${result.data.error}`, 'red');
  }
  return result.ok;
}

async function testCompanySignup() {
  log('\n📝 Test 3: Company Signup', 'cyan');
  const result = await apiCall('POST', '/company/signup', testData.company);
  logTest('Company signup', result.ok);
  if (!result.ok) log(`  Error: ${result.data.error}`, 'red');
  return result.ok;
}

async function testCompanyLogin() {
  log('\n🔐 Test 4: Company Login', 'cyan');
  const loginData = {
    email: testData.company.email,
    password: testData.company.password
  };
  const result = await apiCall('POST', '/company/login', loginData);
  logTest('Company login', result.ok);
  if (result.ok) {
    tokens.company = result.data.token?.replace(/^"|"$/g, '').trim();
    log(`  Token obtained: ${tokens.company ? '✓' : '✗'}`, tokens.company ? 'green' : 'red');
  } else {
    log(`  Error: ${result.data.error}`, 'red');
  }
  return result.ok;
}

async function testPostJob() {
  log('\n💼 Test 5: Post Job', 'cyan');
  const jobData = {
    ...testData.job,
    postedBy: testData.company.email,
    postingDate: new Date().toISOString().split('T')[0]
  };
  const result = await apiCall('POST', '/post-job', jobData, tokens.company);
  logTest('Post job', result.ok);
  if (result.ok) {
    ids.jobId = result.data.insertedId;
    log(`  Job ID: ${ids.jobId}`, 'green');
  } else {
    log(`  Error: ${result.data.error}`, 'red');
  }
  return result.ok;
}

async function testGetJobs() {
  log('\n📋 Test 6: Get All Jobs', 'cyan');
  const result = await apiCall('GET', '/all-jobs');
  logTest('Get all jobs', result.ok && Array.isArray(result.data));
  if (result.ok) {
    log(`  Jobs found: ${result.data.length}`, 'green');
  } else {
    log(`  Error: ${result.data.error}`, 'red');
  }
  return result.ok;
}

async function testGetJobById() {
  log('\n🔍 Test 7: Get Job Details by ID', 'cyan');
  if (!ids.jobId) {
    log('  Skipped: No job ID available', 'yellow');
    return false;
  }
  const result = await apiCall('GET', `/all-jobs/${ids.jobId}`);
  logTest('Get job by ID', result.ok && result.data._id === ids.jobId);
  if (result.ok) {
    log(`  Job title: ${result.data.jobTitle}`, 'green');
  } else {
    log(`  Error: ${result.data.error}`, 'red');
  }
  return result.ok;
}

async function testApplyForJob() {
  log('\n📤 Test 8: Apply for Job', 'cyan');
  if (!ids.jobId) {
    log('  Skipped: No job ID available', 'yellow');
    return false;
  }
  try {
    const form = new FormData();
    form.append('jobId', ids.jobId);

    const resumeText = `Test Resume\nName: ${testData.seeker.name}\nEmail: ${testData.seeker.email}\n`;
    const blob = new Blob([resumeText], { type: 'application/pdf' });
    form.append('resume', blob, 'resume.pdf');

    const res = await fetch(`${BASE_URL}/apply`, {
      method: 'POST',
      headers: {
        ...(tokens.seeker && { 'Authorization': `Bearer ${tokens.seeker}` })
      },
      body: form
    });

    const data = await res.json();
    const ok = res.ok;
    logTest('Apply for job (with resume upload)', ok);

    if (ok) {
      ids.applicationId = data.insertedId;
      log(`  Application ID: ${ids.applicationId}`, 'green');
      log(`  Resume stored: ${data.resume?.url ? '✓' : '✗'}`, data.resume?.url ? 'green' : 'red');
    } else {
      log(`  Error: ${data.error}`, 'red');
    }

    return ok;
  } catch (e) {
    logTest('Apply for job (with resume upload)', false);
    log(`  Error: ${e.message}`, 'red');
    return false;
  }
}

async function testGetMyApplications() {
  log('\n📋 Test 9: Get My Applications (Seeker)', 'cyan');
  const result = await apiCall('GET', `/my-applications/${testData.seeker.email}`, null, tokens.seeker);
  logTest('Get my applications', result.ok && Array.isArray(result.data));
  if (result.ok) {
    log(`  Applications found: ${result.data.length}`, 'green');
  } else {
    log(`  Error: ${result.data.error}`, 'red');
  }
  return result.ok;
}

async function testGetApplicants() {
  log('\n👥 Test 10: Get Applicants (Company)', 'cyan');
  const result = await apiCall('GET', `/applicants/${testData.company.email}`, null, tokens.company);
  logTest('Get applicants', result.ok && Array.isArray(result.data));
  if (result.ok) {
    log(`  Applicants found: ${result.data.length}`, 'green');
  } else {
    log(`  Error: ${result.data.error}`, 'red');
  }
  return result.ok;
}

async function testUpdateApplicationStatus() {
  log('\n✏️ Test 11: Update Application Status', 'cyan');
  if (!ids.applicationId) {
    log('  Skipped: No application ID available', 'yellow');
    return false;
  }
  const statusData = { status: 'interviewed' };
  const result = await apiCall('PATCH', `/application/${ids.applicationId}/status`, statusData, tokens.company);
  logTest('Update application status', result.ok);
  if (result.ok) {
    log(`  Status updated to: interviewed`, 'green');
  } else {
    log(`  Error: ${result.data.error}`, 'red');
  }
  return result.ok;
}

async function testUpdateApplicationStage() {
  log('\n🧩 Test 11b: Update ATS Stage (Company)', 'cyan');
  if (!ids.applicationId) {
    log('  Skipped: No application ID available', 'yellow');
    return false;
  }
  const result = await apiCall('PATCH', `/application/${ids.applicationId}/stage`, { stage: 'screening' }, tokens.company);
  logTest('Update application stage', result.ok);
  if (!result.ok) log(`  Error: ${result.data.error}`, 'red');
  return result.ok;
}

async function testAddCompanyNote() {
  log('\n📝 Test 11c: Add Company Note', 'cyan');
  if (!ids.applicationId) {
    log('  Skipped: No application ID available', 'yellow');
    return false;
  }
  const result = await apiCall('POST', `/application/${ids.applicationId}/notes`, { text: 'Strong React fundamentals.' }, tokens.company);
  logTest('Add note', result.ok);
  if (!result.ok) log(`  Error: ${result.data.error}`, 'red');
  return result.ok;
}

async function testMessaging() {
  log('\n💬 Test 11d: Messaging (Seeker ↔ Company)', 'cyan');
  if (!ids.applicationId) {
    log('  Skipped: No application ID available', 'yellow');
    return false;
  }
  const s1 = await apiCall('POST', `/application/${ids.applicationId}/messages`, { text: 'Hi! Excited about this role.' }, tokens.seeker);
  logTest('Seeker send message', s1.ok);
  if (!s1.ok) return false;

  const c1 = await apiCall('POST', `/application/${ids.applicationId}/messages`, { text: 'Thanks! Can you share availability?' }, tokens.company);
  logTest('Company send message', c1.ok);
  if (!c1.ok) return false;

  const list = await apiCall('GET', `/application/${ids.applicationId}/messages`, null, tokens.seeker);
  logTest('Get messages', list.ok && Array.isArray(list.data) && list.data.length >= 2);
  return list.ok;
}

async function testInterviewScheduling() {
  log('\n📅 Test 11e: Interview Scheduling', 'cyan');
  if (!ids.applicationId) {
    log('  Skipped: No application ID available', 'yellow');
    return false;
  }
  const now = new Date();
  const slot1 = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
  const slot2 = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();

  const propose = await apiCall(
    'POST',
    `/application/${ids.applicationId}/interviews/propose`,
    { slots: [slot1, slot2] },
    tokens.company
  );
  logTest('Propose interview', propose.ok);
  if (!propose.ok) return false;
  ids.interviewId = propose.data?.interview?.id || null;

  const respond = await apiCall(
    'POST',
    `/application/${ids.applicationId}/interviews/${ids.interviewId}/respond`,
    { selectedSlot: slot1 },
    tokens.seeker
  );
  logTest('Accept interview slot', respond.ok);
  if (!respond.ok) return false;

  const list = await apiCall('GET', `/application/${ids.applicationId}/interviews`, null, tokens.company);
  logTest('Get interviews', list.ok && Array.isArray(list.data) && list.data.length >= 1);
  return list.ok;
}

async function testSaveJob() {
  log('\n❤️ Test 12: Save Job', 'cyan');
  if (!ids.jobId) {
    log('  Skipped: No job ID available', 'yellow');
    return false;
  }
  const saveData = {
    jobId: ids.jobId,
    seekerEmail: testData.seeker.email
  };
  const result = await apiCall('POST', '/save-job', saveData, tokens.seeker);
  logTest('Save job', result.ok);
  if (!result.ok) log(`  Error: ${result.data.error}`, 'red');
  return result.ok;
}

async function testGetSavedJobs() {
  log('\n💾 Test 13: Get Saved Jobs', 'cyan');
  const result = await apiCall('GET', `/saved-jobs/${testData.seeker.email}`);
  logTest('Get saved jobs', result.ok && Array.isArray(result.data));
  if (result.ok) {
    log(`  Saved jobs found: ${result.data.length}`, 'green');
  } else {
    log(`  Error: ${result.data.error}`, 'red');
  }
  return result.ok;
}

async function testRemoveSavedJob() {
  log('\n🗑️ Test 14: Remove Saved Job', 'cyan');
  if (!ids.jobId) {
    log('  Skipped: No job ID available', 'yellow');
    return false;
  }
  const result = await apiCall('DELETE', `/saved-job/${ids.jobId}/${testData.seeker.email}`);
  logTest('Remove saved job', result.ok);
  if (!result.ok) log(`  Error: ${result.data.error}`, 'red');
  return result.ok;
}

async function testPostReview() {
  log('\n⭐ Test 15: Post Review', 'cyan');
  const reviewData = {
    companyEmail: testData.company.email,
    seekerEmail: testData.seeker.email,
    rating: 5,
    comment: 'Great company to work with! Excellent culture and benefits.'
  };
  const result = await apiCall('POST', '/company-reviews', reviewData);
  logTest('Post review', result.ok);
  if (!result.ok) log(`  Error: ${result.data.error}`, 'red');
  return result.ok;
}

async function testGetReviews() {
  log('\n📝 Test 16: Get Company Reviews', 'cyan');
  const result = await apiCall('GET', `/company-reviews/${testData.company.email}`);
  logTest('Get reviews', result.ok && Array.isArray(result.data));
  if (result.ok) {
    log(`  Reviews found: ${result.data.length}`, 'green');
  } else {
    log(`  Error: ${result.data.error}`, 'red');
  }
  return result.ok;
}

async function testUpdateUserProfile() {
  log('\n👤 Test 17: Update User Profile', 'cyan');
  const profileData = {
    name: testData.seeker.name,
    email: testData.seeker.email,
    mobile: testData.seeker.mobile,
    about: 'Passionate developer with expertise in React and Node.js'
  };
  const result = await apiCall('PUT', `/user-profile/${testData.seeker.email}`, profileData, tokens.seeker);
  logTest('Update user profile', result.ok);
  if (!result.ok) log(`  Error: ${result.data.error}`, 'red');
  return result.ok;
}

async function testGetUserProfile() {
  log('\n📄 Test 18: Get User Profile', 'cyan');
  const result = await apiCall('GET', `/user-profile/${testData.seeker.email}`, null, tokens.seeker);
  logTest('Get user profile', result.ok && result.data.email === testData.seeker.email);
  if (result.ok) {
    log(`  User: ${result.data.name || 'N/A'}`, 'green');
  } else {
    log(`  Error: ${result.data.error}`, 'red');
  }
  return result.ok;
}

async function testUpdateCompanyProfile() {
  log('\n🏢 Test 19: Update Company Profile', 'cyan');
  const profileData = {
    name: testData.company.name,
    companyName: testData.company.companyName,
    email: testData.company.email,
    location: 'San Francisco, CA',
    website: 'https://testcompany.com',
    about: 'Leading technology company focused on innovation'
  };
  const result = await apiCall('PUT', `/company-profile/${testData.company.email}`, profileData, tokens.company);
  logTest('Update company profile', result.ok);
  if (!result.ok) log(`  Error: ${result.data.error}`, 'red');
  return result.ok;
}

async function testGetCompanyProfile() {
  log('\n📄 Test 20: Get Company Profile', 'cyan');
  const result = await apiCall('GET', `/company-profile/${testData.company.email}`, null, tokens.company);
  logTest('Get company profile', result.ok && result.data.email === testData.company.email);
  if (result.ok) {
    log(`  Company: ${result.data.companyName || 'N/A'}`, 'green');
  } else {
    log(`  Error: ${result.data.error}`, 'red');
  }
  return result.ok;
}

async function testGetSeekerStats() {
  log('\n📊 Test 21: Get Seeker Stats', 'cyan');
  const result = await apiCall('GET', `/stats/seeker/${testData.seeker.email}`);
  logTest('Get seeker stats', result.ok && typeof result.data === 'object');
  if (result.ok) {
    log(`  Applications: ${result.data.appliedCount || 0}`, 'green');
    log(`  Accepted: ${result.data.acceptedCount || 0}`, 'green');
    log(`  Saved: ${result.data.savedCount || 0}`, 'green');
  } else {
    log(`  Error: ${result.data.error}`, 'red');
  }
  return result.ok;
}

async function testGetCompanyStats() {
  log('\n📊 Test 22: Get Company Stats', 'cyan');
  const result = await apiCall('GET', `/stats/company/${testData.company.email}`);
  logTest('Get company stats', result.ok && typeof result.data === 'object');
  if (result.ok) {
    log(`  Jobs Posted: ${result.data.jobsPosted || 0}`, 'green');
    log(`  Total Applications: ${result.data.totalApplications || 0}`, 'green');
    log(`  Accepted: ${result.data.accepted || 0}`, 'green');
  } else {
    log(`  Error: ${result.data.error}`, 'red');
  }
  return result.ok;
}

async function testGetAdminStats() {
  log('\n🔐 Test 23: Get Admin Stats', 'cyan');
  const result = await apiCall('GET', '/admin-stats');
  logTest('Get admin stats', result.ok && typeof result.data === 'object');
  if (result.ok) {
    log(`  Total Users: ${result.data.totalUsers || 0}`, 'green');
    log(`  Total Companies: ${result.data.totalCompanies || 0}`, 'green');
    log(`  Total Jobs: ${result.data.totalJobs || 0}`, 'green');
    log(`  Total Applications: ${result.data.totalApplications || 0}`, 'green');
  } else {
    log(`  Error: ${result.data.error}`, 'red');
  }
  return result.ok;
}

async function testGetMyJobs() {
  log('\n📋 Test 24: Get My Posted Jobs (Company)', 'cyan');
  const result = await apiCall('GET', `/myJobs/${testData.company.email}`);
  logTest('Get my jobs', result.ok && Array.isArray(result.data));
  if (result.ok) {
    log(`  Jobs found: ${result.data.length}`, 'green');
  } else {
    log(`  Error: ${result.data.error}`, 'red');
  }
  return result.ok;
}

// Main test runner
async function runAllTests() {
  log('\n' + '='.repeat(60), 'blue');
  log('🚀 MERN JOB PORTAL - COMPREHENSIVE FEATURE TEST SUITE', 'blue');
  log('='.repeat(60), 'blue');

  const tests = [
    testSeekerSignup,
    testSeekerLogin,
    testCompanySignup,
    testCompanyLogin,
    testPostJob,
    testGetJobs,
    testGetJobById,
    testApplyForJob,
    testGetMyApplications,
    testGetApplicants,
    testUpdateApplicationStatus,
    testUpdateApplicationStage,
    testAddCompanyNote,
    testMessaging,
    testInterviewScheduling,
    testSaveJob,
    testGetSavedJobs,
    testRemoveSavedJob,
    testPostReview,
    testGetReviews,
    testUpdateUserProfile,
    testGetUserProfile,
    testUpdateCompanyProfile,
    testGetCompanyProfile,
    testGetSeekerStats,
    testGetCompanyStats,
    testGetAdminStats,
    testGetMyJobs
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test();
      if (result) passed++;
      else failed++;
    } catch (error) {
      log(`  Exception: ${error.message}`, 'red');
      failed++;
    }
  }

  log('\n' + '='.repeat(60), 'blue');
  log('📊 TEST SUMMARY', 'blue');
  log('='.repeat(60), 'blue');
  log(`Total Tests: ${tests.length}`, 'cyan');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`, passed === tests.length ? 'green' : 'yellow');
  log('\n📝 Test Data Used:', 'cyan');
  log(`  Seeker Email: ${testData.seeker.email}`, 'green');
  log(`  Company Email: ${testData.company.email}`, 'green');
  log(`  Job ID: ${ids.jobId || 'Not created'}`, ids.jobId ? 'green' : 'yellow');
  log('='.repeat(60), 'blue');

  if (failed === 0) {
    log('\n✅ ALL TESTS PASSED! Features are working correctly.', 'green');
  } else {
    log(`\n⚠️  ${failed} test(s) failed. Check errors above.`, 'red');
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Fatal Error: ${error.message}`, 'red');
  process.exit(1);
});
