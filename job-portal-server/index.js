const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"], 
    methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.get('/', (req, res) => {
  res.send('Hello Developer');
});

// MONGO CONNECTION
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.vgn0xjv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("mernJobPortal");
    const jobsCollections = db.collection("demoJobs");
    const usersCollection = db.collection("users");
    const companiesCollection = db.collection("companies");
    const applicationsCollection = db.collection("applications");
    const savedJobsCollection = db.collection("savedJobs");

    const JWT_SECRET = process.env.JWT_SECRET || 'someRandomSecret123';

    // Auth middleware
    function verifyJWT(req, res, next) {
      const authHeader = req.headers.authorization;
      console.log('verifyJWT - Authorization header:', authHeader);
      if (!authHeader) return res.status(401).send({ error: 'Unauthorized' });
      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        console.log('verifyJWT - malformed authorization header');
        return res.status(401).send({ error: 'Invalid token' });
      }
      const token = parts[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
      } catch (err) {
        console.log('verifyJWT - token verify error:', err.message);
        return res.status(401).send({ error: 'Invalid token' });
      }
    }

    // Post Job (protected) - company must be authenticated
    app.post("/post-job", verifyJWT, async (req, res) => {
      try {
        const body = req.body;
        body.createAt = new Date();
        // enforce postedBy from token
        body.postedBy = req.user.email;
        const result = await jobsCollections.insertOne(body);
        res.send(result);
      } catch (err) {
        console.error('Post job error:', err.message);
        res.status(500).send({ error: 'Failed to post job' });
      }
    });

    // Get All Jobs
    app.get("/all-jobs", async (req, res) => {
      const jobs = await jobsCollections.find({}).toArray();
      res.send(jobs);
    });

    // Get Job by ID
    app.get("/all-jobs/:id", async (req, res) => {
      const id = req.params.id;
      const job = await jobsCollections.findOne({ _id: new ObjectId(id) });
      res.send(job);
    });

    // Get jobs by email
    app.get("/myJobs/:email", async (req, res) => {
      const jobs = await jobsCollections
        .find({ postedBy: req.params.email })
        .toArray();
      res.send(jobs);
    });

    // Signup - save job seeker to users collection (hash password)
    app.post('/signup', async (req, res) => {
      try {
        const { name, email, mobile, password } = req.body;
        if (!email || !password || !name) return res.status(400).send({ error: 'Name, email and password required' });
        const existing = await usersCollection.findOne({ email });
        if (existing) return res.status(409).send({ error: 'User already exists' });
        const hashed = await bcrypt.hash(password, 10);
        const user = { name, email, mobile: mobile || '', password: hashed, createdAt: new Date() };
        const result = await usersCollection.insertOne(user);
        res.status(201).send({ insertedId: result.insertedId });
      } catch (err) {
        console.error('Error saving user:', err.message);
        res.status(500).send({ error: 'Failed to save user' });
      }
    });

    // Company signup
    app.post('/company/signup', async (req, res) => {
      try {
        const { name, email, password, companyName } = req.body;
        if (!email || !password) return res.status(400).send({ error: 'Email and password required' });
        const existing = await companiesCollection.findOne({ email });
        if (existing) return res.status(409).send({ error: 'Company already exists' });
        const hashed = await bcrypt.hash(password, 10);
        const company = { name, email, companyName, password: hashed, createdAt: new Date() };
        const result = await companiesCollection.insertOne(company);
        res.status(201).send({ insertedId: result.insertedId });
      } catch (err) {
        console.error('Company signup error:', err.message);
        res.status(500).send({ error: 'Failed to signup company' });
      }
    });

    // Company login
    app.post('/company/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).send({ error: 'Email and password required' });
        const company = await companiesCollection.findOne({ email });
        if (!company) return res.status(401).send({ error: 'Invalid credentials' });
        const match = await bcrypt.compare(password, company.password);
        if (!match) return res.status(401).send({ error: 'Invalid credentials' });
        const token = jwt.sign({ email: company.email, companyName: company.companyName, role: 'company' }, JWT_SECRET, { expiresIn: '1d' });
        res.send({ token });
      } catch (err) {
        console.error('Company login error:', err.message);
        res.status(500).send({ error: 'Failed to login' });
      }
    });

    // User / Job seeker login
    app.post('/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).send({ error: 'Email and password required' });
        const user = await usersCollection.findOne({ email });
        if (!user) return res.status(401).send({ error: 'Invalid credentials' });
        // Try bcrypt compare (for hashed passwords). If that fails, fall back to plain-text comparison.
        let match = false;
        try {
          match = await bcrypt.compare(password, user.password);
        } catch (e) {
          match = false;
        }
        if (!match) {
          // fallback for non-hashed stored passwords
          if (user.password && user.password === password) {
            match = true;
          }
        }
        if (!match) return res.status(401).send({ error: 'Invalid credentials' });
        const token = jwt.sign({ email: user.email, name: user.name || '', role: 'seeker' }, JWT_SECRET, { expiresIn: '1d' });
        res.send({ token });
      } catch (err) {
        console.error('User login error:', err.message);
        res.status(500).send({ error: 'Failed to login' });
      }
    });

    // (debug-users route removed)

    // =====  APPLICATIONS ENDPOINTS =====
    
    // Apply for a job
    app.post('/apply', verifyJWT, async (req, res) => {
      try {
        const { jobId } = req.body;
        const userEmail = req.user.email;
        
        if (!jobId) return res.status(400).send({ error: 'Job ID required' });
        
        // Check if already applied
        const existing = await applicationsCollection.findOne({ jobId: new ObjectId(jobId), userEmail });
        if (existing) return res.status(409).send({ error: 'Already applied to this job' });
        
        // Get job details
        const job = await jobsCollections.findOne({ _id: new ObjectId(jobId) });
        if (!job) return res.status(404).send({ error: 'Job not found' });
        
        // Create application
        const application = {
          jobId: new ObjectId(jobId),
          userEmail,
          jobTitle: job.jobTitle,
          companyName: job.companyName,
          companyEmail: job.postedBy,
          status: 'pending',
          appliedAt: new Date(),
          updatedAt: new Date()
        };
        
        const result = await applicationsCollection.insertOne(application);
        res.status(201).send({ insertedId: result.insertedId });
      } catch (err) {
        console.error('Apply error:', err.message);
        res.status(500).send({ error: 'Failed to apply' });
      }
    });
    
    // Get my applications (for job seeker)
    app.get('/my-applications/:email', async (req, res) => {
      try {
        const userEmail = req.params.email;
        const applications = await applicationsCollection
          .find({ userEmail })
          .sort({ appliedAt: -1 })
          .toArray();
        res.send(applications);
      } catch (err) {
        console.error('Get applications error:', err.message);
        res.status(500).send({ error: 'Failed to fetch applications' });
      }
    });
    
    // Get applicants for a job (for company)
    app.get('/job/:jobId/applicants', async (req, res) => {
      try {
        const jobId = req.params.jobId;
        const applicants = await applicationsCollection
          .find({ jobId: new ObjectId(jobId) })
          .sort({ appliedAt: -1 })
          .toArray();
        res.send(applicants);
      } catch (err) {
        console.error('Get applicants error:', err.message);
        res.status(500).send({ error: 'Failed to fetch applicants' });
      }
    });
    
    // Get all applicants for company (all jobs)
    app.get('/applicants/:companyEmail', async (req, res) => {
      try {
        const companyEmail = req.params.companyEmail;
        const applicants = await applicationsCollection
          .find({ companyEmail })
          .sort({ appliedAt: -1 })
          .toArray();
        res.send(applicants);
      } catch (err) {
        console.error('Get company applicants error:', err.message);
        res.status(500).send({ error: 'Failed to fetch applicants' });
      }
    });
    
    // Update application status (company only)
    app.patch('/application/:appId/status', async (req, res) => {
      try {
        const appId = req.params.appId;
        const { status } = req.body;
        
        const validStatuses = ['pending', 'accepted', 'rejected', 'interviewed'];
        if (!validStatuses.includes(status)) return res.status(400).send({ error: 'Invalid status' });
        
        const result = await applicationsCollection.updateOne(
          { _id: new ObjectId(appId) },
          { $set: { status, updatedAt: new Date() } }
        );
        
        res.send(result);
      } catch (err) {
        console.error('Update status error:', err.message);
        res.status(500).send({ error: 'Failed to update status' });
      }
    });

    // =====  SAVED JOBS ENDPOINTS =====
    
    // Save a job
    app.post('/save-job', verifyJWT, async (req, res) => {
      try {
        const { jobId } = req.body;
        const userEmail = req.user.email;
        
        if (!jobId) return res.status(400).send({ error: 'Job ID required' });
        
        const existing = await savedJobsCollection.findOne({ jobId: new ObjectId(jobId), userEmail });
        if (existing) return res.status(409).send({ error: 'Already saved' });
        
        const job = await jobsCollections.findOne({ _id: new ObjectId(jobId) });
        if (!job) return res.status(404).send({ error: 'Job not found' });
        
        const savedJob = {
          jobId: new ObjectId(jobId),
          userEmail,
          jobTitle: job.jobTitle,
          companyName: job.companyName,
          savedAt: new Date()
        };
        
        const result = await savedJobsCollection.insertOne(savedJob);
        res.status(201).send({ insertedId: result.insertedId });
      } catch (err) {
        console.error('Save job error:', err.message);
        res.status(500).send({ error: 'Failed to save job' });
      }
    });
    
    // Get saved jobs
    app.get('/saved-jobs/:email', async (req, res) => {
      try {
        const userEmail = req.params.email;
        const savedJobs = await savedJobsCollection
          .find({ userEmail })
          .sort({ savedAt: -1 })
          .toArray();
        res.send(savedJobs);
      } catch (err) {
        console.error('Get saved jobs error:', err.message);
        res.status(500).send({ error: 'Failed to fetch saved jobs' });
      }
    });
    
    // Remove saved job
    app.delete('/saved-job/:jobId/:email', async (req, res) => {
      try {
        const jobId = req.params.jobId;
        const userEmail = req.params.email;
        const result = await savedJobsCollection.deleteOne({ jobId: new ObjectId(jobId), userEmail });
        res.send(result);
      } catch (err) {
        console.error('Delete saved job error:', err.message);
        res.status(500).send({ error: 'Failed to delete' });
      }
    });

    // =====  ANALYTICS ENDPOINTS =====
    
    // Company dashboard stats
    app.get('/stats/company/:email', async (req, res) => {
      try {
        const companyEmail = req.params.email;
        
        const totalJobs = await jobsCollections.countDocuments({ postedBy: companyEmail });
        const totalApplicants = await applicationsCollection.countDocuments({ companyEmail });
        const pendingApplications = await applicationsCollection.countDocuments({ companyEmail, status: 'pending' });
        const acceptedApplications = await applicationsCollection.countDocuments({ companyEmail, status: 'accepted' });
        
        res.send({ totalJobs, totalApplicants, pendingApplications, acceptedApplications });
      } catch (err) {
        console.error('Stats error:', err.message);
        res.status(500).send({ error: 'Failed to fetch stats' });
      }
    });
    
    // Job seeker stats
    app.get('/stats/seeker/:email', async (req, res) => {
      try {
        const userEmail = req.params.email;
        
        const totalApplications = await applicationsCollection.countDocuments({ userEmail });
        const savedJobs = await savedJobsCollection.countDocuments({ userEmail });
        const acceptedCount = await applicationsCollection.countDocuments({ userEmail, status: 'accepted' });
        
        res.send({ totalApplications, savedJobs, acceptedCount });
      } catch (err) {
        console.error('Seeker stats error:', err.message);
        res.status(500).send({ error: 'Failed to fetch stats' });
      }
    });

    // User Profile endpoints
    app.get('/user-profile/:email', async (req, res) => {
      try {
        const email = req.params.email;
        const user = await usersCollection.findOne({ email });
        if (user) {
          res.send(user);
        } else {
          res.status(404).send({ error: 'User not found' });
        }
      } catch (err) {
        res.status(500).send({ error: 'Failed to fetch profile' });
      }
    });

    app.put('/user-profile/:email', verifyJWT, async (req, res) => {
      try {
        const email = req.params.email;
        const update = req.body;
        const result = await usersCollection.updateOne(
          { email },
          { $set: update },
          { upsert: true }
        );
        res.send({ success: true, message: 'Profile updated' });
      } catch (err) {
        res.status(500).send({ error: 'Failed to update profile' });
      }
    });

    // Company Profile endpoints
    app.get('/company-profile/:email', async (req, res) => {
      try {
        const email = req.params.email;
        const company = await companiesCollection.findOne({ email });
        if (company) {
          res.send(company);
        } else {
          res.status(404).send({ error: 'Company not found' });
        }
      } catch (err) {
        res.status(500).send({ error: 'Failed to fetch profile' });
      }
    });

    app.put('/company-profile/:email', verifyJWT, async (req, res) => {
      try {
        const email = req.params.email;
        const update = req.body;
        const result = await companiesCollection.updateOne(
          { email },
          { $set: update },
          { upsert: true }
        );
        res.send({ success: true, message: 'Profile updated' });
      } catch (err) {
        res.status(500).send({ error: 'Failed to update profile' });
      }
    });

    // Company Reviews endpoints
    const reviewsCollection = db.collection("reviews");

    app.post('/company-reviews', async (req, res) => {
      try {
        const { companyEmail, seekerEmail, rating, comment } = req.body;
        const review = {
          companyEmail,
          seekerEmail,
          rating: parseInt(rating),
          comment,
          postedAt: new Date()
        };
        const result = await reviewsCollection.insertOne(review);
        res.send({ success: true, result });
      } catch (err) {
        console.error('Review post error:', err);
        res.status(500).send({ error: 'Failed to post review' });
      }
    });

    app.get('/company-reviews/:companyEmail', async (req, res) => {
      try {
        const companyEmail = req.params.companyEmail;
        const reviews = await reviewsCollection.find({ companyEmail }).toArray();
        res.send(reviews);
      } catch (err) {
        res.status(500).send({ error: 'Failed to fetch reviews' });
      }
    });

    // Admin Stats endpoint
    app.get('/admin-stats', async (req, res) => {
      try {
        const totalUsers = await usersCollection.countDocuments();
        const totalCompanies = await companiesCollection.countDocuments();
        const totalJobs = await jobsCollections.countDocuments();
        const totalApplications = await applicationsCollection.countDocuments();
        const acceptedApplications = await applicationsCollection.countDocuments({ status: 'accepted' });
        
        res.send({
          totalUsers,
          totalCompanies,
          totalJobs,
          totalApplications,
          acceptedApplications
        });
      } catch (err) {
        console.error('Admin stats error:', err);
        res.status(500).send({ error: 'Failed to fetch stats' });
      }
    });

    // (debug-users route removed)

    // Delete job
    app.delete("/job/:id", async (req, res) => {
      const id = req.params.id;
      const result = await jobsCollections.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // Update job
    app.patch("/update-job/:id", async (req, res) => {
      const id = req.params.id;
      const jobData = req.body;

      const result = await jobsCollections.updateOne(
        { _id: new ObjectId(id) },
        { $set: jobData },
        { upsert: true }
      );

      res.send(result);
    });

    // Ping MongoDB
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Connected to MongoDB successfully!");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
  }
}
run().catch(console.dir);

// Start Server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
