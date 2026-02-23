# 🚀 Quick Start Testing Guide

## Step 1: Start the Servers

### Terminal 1 - Backend Server
```bash
cd job-portal-server
npm start
# Expected output: 🚀 Server running on port 3000
```

### Terminal 2 - Frontend Server
```bash
cd job-portal-client
npm run dev
# Expected output: ➜  Local: http://localhost:5173
```

### Terminal 3 - Run Tests
```bash
# Make sure you're in the project root directory
cd MERN_Job_Portal_Website

# Run the comprehensive feature test
node test-all-features.js
```

---

## Step 2: What to Expect

### ✅ Successful Test Run
```
============================================================
🚀 MERN JOB PORTAL - COMPREHENSIVE FEATURE TEST SUITE
============================================================

📝 Test 1: Seeker Signup
  ✓ PASSED  Seeker signup

🔐 Test 2: Seeker Login
  ✓ PASSED  Seeker login
  Token obtained: ✓

... (22 more tests)

============================================================
📊 TEST SUMMARY
============================================================
Total Tests: 24
Passed: 24
Failed: 0
Success Rate: 100.0%

✅ ALL TESTS PASSED! Features are working correctly.
```

---

## Step 3: Verify MongoDB Data

### Option A: Using MongoDB Compass (GUI)
1. Open MongoDB Compass
2. Connect to your MongoDB instance
3. Look for database: `mernJobPortal`
4. Inside, you should see collections:
   - `users` ✓
   - `companies` ✓
   - `demoJobs` ✓
   - `applications` ✓
   - `savedJobs` (may be empty - test removes saves)
   - `reviews` ✓

### Option B: Using MongoDB Script
```bash
# Run MongoDB validation script
node validate-mongodb.js
```

Expected output:
```
🗄️  MONGODB VALIDATION REPORT
============================================================

📋 Validating Collection: users
  ✓ Documents found: 1
  ✓ Sample document ID: ObjectId(...)
  ✓ Fields: _id, name, email, password, mobile

📋 Validating Collection: companies
  ✓ Documents found: 1
  ✓ Sample document ID: ObjectId(...)
  ✓ Fields: _id, name, email, password, companyName

... (more collections)

✅ MongoDB validation PASSED!
```

---

## Step 4: Manual Browser Testing

Once servers are running, visit: `http://localhost:5173`

### Test Seeker Workflow
1. Click "Sign up" → "Sign up as Seeker"
2. Register with test account
3. Login with same credentials
4. Browse jobs
5. Click on a job
6. Click "Apply Now" or "Save Job"
7. Click profile icon → view saved jobs/applications

### Test Company Workflow
1. Click "Sign up" → "Sign up as Company"
2. Register test company
3. Login with company credentials  
4. Click "Post a Job"
5. Fill form and post
6. Click "Applicants" to see applications
7. Review and update applicant status

---

## Troubleshooting

### ❌ "Connection refused" Error
**Solution**: Make sure backend server is running
```bash
cd job-portal-server
npm start
```

### ❌ "Invalid token" Error
**Solution**: Restart backend server and clear browser cache
```bash
# Kill the server (Ctrl+C)
# Clear localStorage in browser DevTools
# Restart: npm start
```

### ❌ "Database not found" Error
**Solution**: Check MongoDB connection in `.env`
- Verify DB_USER, DB_PASSWORD
- Check network access/IP whitelist if using MongoDB Atlas
- Ensure database name is `mernJobPortal`

### ❌ Empty collections after tests
**Solution**: Check MongoDB storage quota
- If using free tier (MongoDB Atlas), storage may be full
- Delete test data and try again
- Or upgrade to paid tier

---

## Test Results Interpretation

### ✅ All Tests Passed (24/24)
- **Status**: READY FOR PRODUCTION ✅
- All features working correctly
- Data properly stored in MongoDB
- Security measures in place
- No errors or warnings

### ⚠️ Some Tests Failed (< 24/24)
- **Status**: NEEDS INVESTIGATION
- Check error messages in test output
- Review MongoDB logs
- Verify environment variables
- Ensure server is properly running

### ❌ Critical Failure (0/24)
- **Status**: CANNOT PROCEED
- Backend server not responding
- MongoDB connection failed
- Invalid API endpoints
- Check servers and database connections

---

## Features Tested (24 Tests Total)

| # | Feature | Status |
|---|---------|--------|
| 1 | Seeker Signup | ✓ |
| 2 | Seeker Login | ✓ |
| 3 | Company Signup | ✓ |
| 4 | Company Login | ✓ |
| 5 | Post Job | ✓ |
| 6 | Get All Jobs | ✓ |
| 7 | Get Job by ID | ✓ |
| 8 | Apply for Job | ✓ |
| 9 | Get Applications | ✓ |
| 10 | Get Applicants | ✓ |
| 11 | Update Status | ✓ |
| 12 | Save Job | ✓ |
| 13 | Get Saved Jobs | ✓ |
| 14 | Remove Saved Job | ✓ |
| 15 | Post Review | ✓ |
| 16 | Get Reviews | ✓ |
| 17 | Update User Profile | ✓ |
| 18 | Get User Profile | ✓ |
| 19 | Update Company Profile | ✓ |
| 20 | Get Company Profile | ✓ |
| 21 | Get Seeker Stats | ✓ |
| 22 | Get Company Stats | ✓ |
| 23 | Get Admin Stats | ✓ |
| 24 | Get My Posted Jobs | ✓ |

---

## Test Data Generated

Each test run creates fresh test accounts with unique emails and stores them in MongoDB:

```javascript
Test Seeker:
- Email: seeker-{timestamp}@test.com
- Password: Test@123
- Name: Test Seeker
- Mobile: 1234567890

Test Company:
- Email: company-{timestamp}@test.com
- Password: Test@123
- Company: Test Company Inc
- Name: Test Company HR

Test Job:
- Title: Senior React Developer
- Salary: 5 - 15 LPA
- Location: San Francisco
- Skills: React, Node.js
```

---

## Next Steps After Testing

1. ✅ **Verify all tests pass**: Run `node test-all-features.js`
2. ✅ **Check MongoDB data**: Run `node validate-mongodb.js`
3. ✅ **Manual testing**: Test in browser at localhost:5173
4. ✅ **Clean test data**: Delete old test records from MongoDB
5. ✅ **Deploy to production** when ready

---

## Common Test Commands

```bash
# Run comprehensive feature tests
node test-all-features.js

# Validate MongoDB collections
node validate-mongodb.js

# Start backend server
cd job-portal-server && npm start

# Start frontend server
cd job-portal-client && npm run dev

# View test results
# Check console output for detailed results
```

---

## Support

For detailed documentation, see: [TEST_GUIDE.md](./TEST_GUIDE.md)

For issues:
1. Check error messages in test output
2. Verify servers are running (port 3000 and 5173)
3. Confirm MongoDB credentials in .env
4. Review backend logs for errors
5. Check MongoDB Atlas dashboard if using cloud

---

**Last Updated**: February 2026  
**Test Coverage**: 24 comprehensive tests  
**Status**: Ready for testing ✅
