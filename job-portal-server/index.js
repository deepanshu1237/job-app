const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 3000;
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:5174")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Serve uploaded resumes
// Vercel serverless filesystem is read-only except /tmp.
const uploadsDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

app.get('/', (req, res) => {
  res.send('Hello Developer');
});

// MONGO CONNECTION
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Prefer a full URI so the app works with local MongoDB or any Atlas cluster.
// Examples:
// - mongodb://127.0.0.1:27017/mernJobPortal
// - mongodb+srv://<user>:<pass>@<cluster-host>/<db>?retryWrites=true&w=majority
const uri =
  process.env.MONGODB_URI ||
  `mongodb://127.0.0.1:27017/${process.env.DB_NAME || 'mernJobPortal'}`;

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

    const db = client.db(process.env.DB_NAME || "mernJobPortal");
    const jobsCollections = db.collection("demoJobs");
    const usersCollection = db.collection("users");
    const companiesCollection = db.collection("companies");
    const applicationsCollection = db.collection("applications");
    const savedJobsCollection = db.collection("savedJobs");
    const jobReportsCollection = db.collection("jobReports");
    const referralRequestsCollection = db.collection("referralRequests");

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

    function requireRole(role) {
      return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
          return res.status(403).send({ error: 'Forbidden' });
        }
        next();
      };
    }

    function evaluateScamRisk(job = {}) {
      const reasons = [];
      let score = 0;

      const title = String(job.jobTitle || '').toLowerCase();
      const desc = String(job.description || '').toLowerCase();
      const suspicious = [
        'pay fee',
        'registration fee',
        'urgent payment',
        'whatsapp only',
        'telegram',
        'no interview',
        'guaranteed job',
      ];
      for (const kw of suspicious) {
        if (title.includes(kw) || desc.includes(kw)) {
          score += 20;
          reasons.push(`Suspicious keyword: "${kw}"`);
        }
      }

      const maxPrice = Number(job.maxPrice);
      if (Number.isFinite(maxPrice) && maxPrice > 1000000) {
        score += 15;
        reasons.push('Unusually high salary value');
      }

      if (!job.companyLogo) {
        score += 10;
        reasons.push('Missing company logo');
      }
      if (!job.jobLocation) {
        score += 10;
        reasons.push('Missing job location');
      }

      const riskLevel = score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';
      return {
        scamScore: Math.min(score, 100),
        riskLevel,
        riskReasons: reasons,
        isFlagged: riskLevel !== 'low',
      };
    }

    function parseStudentProfileFields(payload = {}) {
      const out = {};
      const errors = [];

      const numberOrNull = (value) => {
        if (value === undefined || value === null || value === '') return null;
        const n = Number(value);
        return Number.isFinite(n) ? n : NaN;
      };

      const tenth = numberOrNull(payload.tenthPercentage);
      if (Number.isNaN(tenth) || (tenth !== null && (tenth < 0 || tenth > 100))) {
        errors.push('10th percentage must be between 0 and 100');
      } else out.tenthPercentage = tenth;

      const twelfth = numberOrNull(payload.twelfthPercentage);
      if (Number.isNaN(twelfth) || (twelfth !== null && (twelfth < 0 || twelfth > 100))) {
        errors.push('12th percentage must be between 0 and 100');
      } else out.twelfthPercentage = twelfth;

      const cgpa = numberOrNull(payload.cgpa);
      if (Number.isNaN(cgpa) || (cgpa !== null && (cgpa < 0 || cgpa > 10))) {
        errors.push('CGPA must be between 0 and 10');
      } else out.cgpa = cgpa;

      const passoutYear = numberOrNull(payload.passoutYear);
      const currentYear = new Date().getFullYear();
      if (Number.isNaN(passoutYear) || (passoutYear !== null && (passoutYear < 1990 || passoutYear > currentYear + 10))) {
        errors.push(`Passout year must be between 1990 and ${currentYear + 10}`);
      } else out.passoutYear = passoutYear;

      const exp = numberOrNull(payload.experienceYears);
      if (Number.isNaN(exp) || (exp !== null && (exp < 0 || exp > 50))) {
        errors.push('Experience years must be between 0 and 50');
      } else out.experienceYears = exp ?? 0;

      out.skills = Array.isArray(payload.skills)
        ? payload.skills.map((s) => String(s).trim()).filter(Boolean).slice(0, 50)
        : [];
      out.degree = String(payload.degree || '').trim().slice(0, 120);
      out.branch = String(payload.branch || '').trim().slice(0, 120);
      out.college = String(payload.college || '').trim().slice(0, 180);

      return { out, errors };
    }

    // Resume upload (PDF/DOC/DOCX up to 5MB)
    const resumeUpload = multer({
      storage: multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, uploadsDir),
        filename: (_req, file, cb) => {
          const safeBase = (file.originalname || 'resume')
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .slice(-80);
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}-${safeBase}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = new Set([
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ]);
        if (!allowed.has(file.mimetype)) return cb(new Error('Unsupported resume format'));
        cb(null, true);
      },
    });

    // Post Job (protected) - company must be authenticated
    app.post("/post-job", verifyJWT, async (req, res) => {
      try {
        if (!req.user || req.user.role !== 'company') return res.status(403).send({ error: 'Forbidden' });
        const body = req.body || {};
        if (!body.jobTitle || !body.companyName || !body.jobLocation || !body.employmentType || !body.description) {
          return res.status(400).send({ error: 'Missing required job fields' });
        }
        body.createAt = new Date();
        body.postingDate = body.postingDate || new Date().toISOString().split('T')[0];
        body.status = body.status || 'active';
        if (body.minExperienceYears !== undefined && body.minExperienceYears !== null && body.minExperienceYears !== '') {
          const n = Number(body.minExperienceYears);
          body.minExperienceYears = Number.isFinite(n) ? n : 0;
        }
        if (body.minSkillMatch !== undefined && body.minSkillMatch !== null && body.minSkillMatch !== '') {
          const n = Number(body.minSkillMatch);
          body.minSkillMatch = Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
        }
        body.scamShield = evaluateScamRisk(body);
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

    // Job reporting (scam shield)
    app.post('/jobs/:id/report', verifyJWT, requireRole('seeker'), async (req, res) => {
      try {
        const jobId = req.params.id;
        const { reason } = req.body || {};
        const job = await jobsCollections.findOne({ _id: new ObjectId(jobId) });
        if (!job) return res.status(404).send({ error: 'Job not found' });

        const existing = await jobReportsCollection.findOne({ jobId: new ObjectId(jobId), reporterEmail: req.user.email });
        if (existing) return res.status(409).send({ error: 'Already reported' });

        const report = {
          jobId: new ObjectId(jobId),
          reporterEmail: req.user.email,
          reason: String(reason || '').trim() || 'Suspicious job',
          status: 'open',
          createdAt: new Date(),
        };
        const result = await jobReportsCollection.insertOne(report);
        res.status(201).send({ insertedId: result.insertedId });
      } catch (err) {
        res.status(500).send({ error: 'Failed to report job' });
      }
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
        const {
          name,
          email,
          mobile,
          password,
          skills,
          experienceYears,
          tenthPercentage,
          twelfthPercentage,
          cgpa,
          degree,
          branch,
          college,
          passoutYear,
        } = req.body || {};
        if (!email || !password || !name) return res.status(400).send({ error: 'Name, email and password required' });
        const existing = await usersCollection.findOne({ email });
        if (existing) return res.status(409).send({ error: 'User already exists' });
        const hashed = await bcrypt.hash(password, 10);
        const { out: studentFields, errors } = parseStudentProfileFields({
          skills,
          experienceYears,
          tenthPercentage,
          twelfthPercentage,
          cgpa,
          degree,
          branch,
          college,
          passoutYear,
        });
        if (errors.length > 0) return res.status(400).send({ error: errors[0], errors });

        const user = {
          name,
          email,
          mobile: mobile || '',
          password: hashed,
          createdAt: new Date(),
          ...studentFields,
        };
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
    
    async function getApplicationOr404(appId, res) {
      let appDoc = null;
      try {
        appDoc = await applicationsCollection.findOne({ _id: new ObjectId(appId) });
      } catch {
        return null;
      }
      if (!appDoc) {
        res.status(404).send({ error: 'Application not found' });
        return null;
      }
      return appDoc;
    }

    function assertCanAccessApplication(appDoc, user) {
      if (!user) return false;
      if (user.role === 'company') return appDoc.companyEmail === user.email;
      if (user.role === 'seeker') return appDoc.userEmail === user.email;
      return false;
    }
    
    // Apply for a job (job seeker only) + upload resume
    // multipart/form-data: fields: jobId, file: resume
    app.post(
      '/apply',
      verifyJWT,
      requireRole('seeker'),
      resumeUpload.single('resume'),
      async (req, res) => {
        try {
          const jobId = req.body?.jobId;
          const userEmail = req.user.email;

          if (!jobId) return res.status(400).send({ error: 'Job ID required' });
          if (!req.file) return res.status(400).send({ error: 'Resume file is required' });

          // Check if already applied
          const existing = await applicationsCollection.findOne({ jobId: new ObjectId(jobId), userEmail });
          if (existing) return res.status(409).send({ error: 'Already applied to this job' });

          // Get job details
          const job = await jobsCollections.findOne({ _id: new ObjectId(jobId) });
          if (!job) return res.status(404).send({ error: 'Job not found' });

          const resume = {
            originalName: req.file.originalname,
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size,
            url: `/uploads/${req.file.filename}`,
            uploadedAt: new Date(),
          };

          // Create application
          const application = {
            jobId: new ObjectId(jobId),
            userEmail,
            jobTitle: job.jobTitle,
            companyName: job.companyName,
            companyEmail: job.postedBy,
            // status is used by the current UI (pending/accepted/rejected/interviewed)
            status: 'pending',
            // ATS pipeline stage
            stage: 'new',
            tags: [],
            notes: [],
            messages: [],
            interviews: [],
            timeline: [{ at: new Date(), type: 'applied', byRole: 'seeker', byEmail: userEmail }],
            resume,
            appliedAt: new Date(),
            updatedAt: new Date(),
          };

          const result = await applicationsCollection.insertOne(application);
          res.status(201).send({ insertedId: result.insertedId, resume });
        } catch (err) {
          console.error('Apply error:', err.message);
          res.status(500).send({ error: 'Failed to apply' });
        }
      }
    );
    
    // Get my applications (for job seeker)
    app.get('/my-applications/:email', verifyJWT, requireRole('seeker'), async (req, res) => {
      try {
        const userEmail = req.params.email;
        if (userEmail !== req.user.email) return res.status(403).send({ error: 'Forbidden' });
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
    app.get('/job/:jobId/applicants', verifyJWT, requireRole('company'), async (req, res) => {
      try {
        const jobId = req.params.jobId;
        const applicants = await applicationsCollection
          .find({ jobId: new ObjectId(jobId), companyEmail: req.user.email })
          .sort({ appliedAt: -1 })
          .toArray();
        res.send(applicants);
      } catch (err) {
        console.error('Get applicants error:', err.message);
        res.status(500).send({ error: 'Failed to fetch applicants' });
      }
    });
    
    // Get all applicants for company (all jobs) (company only)
    app.get('/applicants/:companyEmail', verifyJWT, requireRole('company'), async (req, res) => {
      try {
        const companyEmail = req.params.companyEmail;
        if (companyEmail !== req.user.email) return res.status(403).send({ error: 'Forbidden' });
        const applicants = await applicationsCollection
          .find({ companyEmail })
          .sort({ appliedAt: -1 })
          .toArray();
        const seekerEmails = [...new Set(applicants.map((a) => a.userEmail).filter(Boolean))];
        const seekerProfiles = await usersCollection
          .find({ email: { $in: seekerEmails } }, { projection: { email: 1, name: 1, skills: 1, experienceYears: 1, proofLinks: 1, certificates: 1 } })
          .toArray();
        const profileMap = new Map(seekerProfiles.map((p) => [p.email, p]));
        res.send(applicants.map((a) => ({ ...a, seekerProfile: profileMap.get(a.userEmail) || null })));
      } catch (err) {
        console.error('Get company applicants error:', err.message);
        res.status(500).send({ error: 'Failed to fetch applicants' });
      }
    });
    
    // Update application status (company only)
    app.patch('/application/:appId/status', verifyJWT, requireRole('company'), async (req, res) => {
      try {
        const appId = req.params.appId;
        const { status } = req.body;
        
        const validStatuses = ['pending', 'accepted', 'rejected', 'interviewed'];
        if (!validStatuses.includes(status)) return res.status(400).send({ error: 'Invalid status' });

        // ensure company owns this application
        const existing = await applicationsCollection.findOne({ _id: new ObjectId(appId) });
        if (!existing) return res.status(404).send({ error: 'Application not found' });
        if (existing.companyEmail !== req.user.email) return res.status(403).send({ error: 'Forbidden' });
        
        const result = await applicationsCollection.updateOne(
          { _id: new ObjectId(appId) },
          {
            $set: { status, updatedAt: new Date() },
            $push: { timeline: { at: new Date(), type: 'status_changed', byRole: 'company', byEmail: req.user.email, meta: { status } } }
          }
        );
        
        res.send(result);
      } catch (err) {
        console.error('Update status error:', err.message);
        res.status(500).send({ error: 'Failed to update status' });
      }
    });

    // ===== ATS PIPELINE (company) =====
    app.patch('/application/:appId/stage', verifyJWT, requireRole('company'), async (req, res) => {
      try {
        const appId = req.params.appId;
        const { stage } = req.body;
        const validStages = ['new', 'screening', 'interview', 'offer', 'hired', 'rejected'];
        if (!validStages.includes(stage)) return res.status(400).send({ error: 'Invalid stage' });

        const existing = await getApplicationOr404(appId, res);
        if (!existing) return;
        if (existing.companyEmail !== req.user.email) return res.status(403).send({ error: 'Forbidden' });

        const result = await applicationsCollection.updateOne(
          { _id: new ObjectId(appId) },
          {
            $set: { stage, updatedAt: new Date() },
            $push: { timeline: { at: new Date(), type: 'stage_changed', byRole: 'company', byEmail: req.user.email, meta: { stage } } }
          }
        );
        res.send(result);
      } catch (err) {
        console.error('Update stage error:', err.message);
        res.status(500).send({ error: 'Failed to update stage' });
      }
    });

    app.post('/application/:appId/notes', verifyJWT, requireRole('company'), async (req, res) => {
      try {
        const appId = req.params.appId;
        const { text } = req.body;
        if (!text || !text.trim()) return res.status(400).send({ error: 'Note text required' });

        const existing = await getApplicationOr404(appId, res);
        if (!existing) return;
        if (existing.companyEmail !== req.user.email) return res.status(403).send({ error: 'Forbidden' });

        const note = { id: new ObjectId().toString(), text: text.trim(), at: new Date(), byEmail: req.user.email };
        const result = await applicationsCollection.updateOne(
          { _id: new ObjectId(appId) },
          {
            $push: { notes: note, timeline: { at: new Date(), type: 'note_added', byRole: 'company', byEmail: req.user.email } },
            $set: { updatedAt: new Date() }
          }
        );
        res.status(201).send({ ok: true, note, result });
      } catch (err) {
        console.error('Add note error:', err.message);
        res.status(500).send({ error: 'Failed to add note' });
      }
    });

    app.put('/application/:appId/tags', verifyJWT, requireRole('company'), async (req, res) => {
      try {
        const appId = req.params.appId;
        const { tags } = req.body;
        if (!Array.isArray(tags)) return res.status(400).send({ error: 'tags must be an array' });

        const cleaned = [...new Set(tags.map(t => String(t).trim()).filter(Boolean))].slice(0, 20);
        const existing = await getApplicationOr404(appId, res);
        if (!existing) return;
        if (existing.companyEmail !== req.user.email) return res.status(403).send({ error: 'Forbidden' });

        const result = await applicationsCollection.updateOne(
          { _id: new ObjectId(appId) },
          {
            $set: { tags: cleaned, updatedAt: new Date() },
            $push: { timeline: { at: new Date(), type: 'tags_updated', byRole: 'company', byEmail: req.user.email, meta: { tags: cleaned } } }
          }
        );
        res.send({ ok: true, tags: cleaned, result });
      } catch (err) {
        console.error('Update tags error:', err.message);
        res.status(500).send({ error: 'Failed to update tags' });
      }
    });

    // ===== Messaging (seeker + company) =====
    app.get('/application/:appId/messages', verifyJWT, async (req, res) => {
      try {
        const appId = req.params.appId;
        const appDoc = await getApplicationOr404(appId, res);
        if (!appDoc) return;
        if (!assertCanAccessApplication(appDoc, req.user)) return res.status(403).send({ error: 'Forbidden' });
        res.send(appDoc.messages || []);
      } catch (err) {
        console.error('Get messages error:', err.message);
        res.status(500).send({ error: 'Failed to fetch messages' });
      }
    });

    app.post('/application/:appId/messages', verifyJWT, async (req, res) => {
      try {
        const appId = req.params.appId;
        const { text } = req.body;
        if (!text || !text.trim()) return res.status(400).send({ error: 'Message text required' });

        const appDoc = await getApplicationOr404(appId, res);
        if (!appDoc) return;
        if (!assertCanAccessApplication(appDoc, req.user)) return res.status(403).send({ error: 'Forbidden' });

        const msg = {
          id: new ObjectId().toString(),
          text: text.trim(),
          at: new Date(),
          senderRole: req.user.role,
          senderEmail: req.user.email,
        };

        const result = await applicationsCollection.updateOne(
          { _id: new ObjectId(appId) },
          {
            $push: { messages: msg, timeline: { at: new Date(), type: 'message_sent', byRole: req.user.role, byEmail: req.user.email } },
            $set: { updatedAt: new Date() }
          }
        );
        res.status(201).send({ ok: true, message: msg, result });
      } catch (err) {
        console.error('Send message error:', err.message);
        res.status(500).send({ error: 'Failed to send message' });
      }
    });

    // ===== Interview scheduling =====
    app.post('/application/:appId/interviews/propose', verifyJWT, requireRole('company'), async (req, res) => {
      try {
        const appId = req.params.appId;
        const { slots } = req.body;
        if (!Array.isArray(slots) || slots.length === 0) return res.status(400).send({ error: 'slots array required' });

        const appDoc = await getApplicationOr404(appId, res);
        if (!appDoc) return;
        if (appDoc.companyEmail !== req.user.email) return res.status(403).send({ error: 'Forbidden' });

        const parsedSlots = slots
          .map(s => new Date(s))
          .filter(d => !Number.isNaN(d.getTime()))
          .slice(0, 10);
        if (parsedSlots.length === 0) return res.status(400).send({ error: 'No valid slots' });

        const interview = {
          id: new ObjectId().toString(),
          proposedBy: req.user.email,
          proposedAt: new Date(),
          slots: parsedSlots,
          status: 'proposed',
          selectedSlot: null,
          respondedAt: null,
        };

        const result = await applicationsCollection.updateOne(
          { _id: new ObjectId(appId) },
          {
            $push: { interviews: interview, timeline: { at: new Date(), type: 'interview_proposed', byRole: 'company', byEmail: req.user.email } },
            $set: { updatedAt: new Date() }
          }
        );
        res.status(201).send({ ok: true, interview, result });
      } catch (err) {
        console.error('Propose interview error:', err.message);
        res.status(500).send({ error: 'Failed to propose interview' });
      }
    });

    app.post('/application/:appId/interviews/:interviewId/respond', verifyJWT, requireRole('seeker'), async (req, res) => {
      try {
        const appId = req.params.appId;
        const interviewId = req.params.interviewId;
        const { selectedSlot } = req.body;
        if (!selectedSlot) return res.status(400).send({ error: 'selectedSlot required' });

        const appDoc = await getApplicationOr404(appId, res);
        if (!appDoc) return;
        if (appDoc.userEmail !== req.user.email) return res.status(403).send({ error: 'Forbidden' });

        const slotDate = new Date(selectedSlot);
        if (Number.isNaN(slotDate.getTime())) return res.status(400).send({ error: 'Invalid selectedSlot' });

        const interview = (appDoc.interviews || []).find(i => i.id === interviewId);
        if (!interview) return res.status(404).send({ error: 'Interview not found' });

        const allowed = (interview.slots || []).some(s => new Date(s).getTime() === slotDate.getTime());
        if (!allowed) return res.status(400).send({ error: 'Selected slot not in proposed slots' });

        const result = await applicationsCollection.updateOne(
          { _id: new ObjectId(appId), 'interviews.id': interviewId },
          {
            $set: {
              'interviews.$.status': 'accepted',
              'interviews.$.selectedSlot': slotDate,
              'interviews.$.respondedAt': new Date(),
              updatedAt: new Date(),
            },
            $push: { timeline: { at: new Date(), type: 'interview_accepted', byRole: 'seeker', byEmail: req.user.email } }
          }
        );
        res.send({ ok: true, result });
      } catch (err) {
        console.error('Respond interview error:', err.message);
        res.status(500).send({ error: 'Failed to respond to interview' });
      }
    });

    app.get('/application/:appId/interviews', verifyJWT, async (req, res) => {
      try {
        const appId = req.params.appId;
        const appDoc = await getApplicationOr404(appId, res);
        if (!appDoc) return;
        if (!assertCanAccessApplication(appDoc, req.user)) return res.status(403).send({ error: 'Forbidden' });
        res.send(appDoc.interviews || []);
      } catch (err) {
        console.error('Get interviews error:', err.message);
        res.status(500).send({ error: 'Failed to fetch interviews' });
      }
    });

    app.get('/application/:appId/interviews/:interviewId/ics', verifyJWT, async (req, res) => {
      try {
        const appId = req.params.appId;
        const interviewId = req.params.interviewId;
        const appDoc = await getApplicationOr404(appId, res);
        if (!appDoc) return;
        if (!assertCanAccessApplication(appDoc, req.user)) return res.status(403).send({ error: 'Forbidden' });

        const interview = (appDoc.interviews || []).find(i => i.id === interviewId);
        if (!interview || !interview.selectedSlot) return res.status(404).send({ error: 'Accepted interview not found' });

        const start = new Date(interview.selectedSlot);
        const end = new Date(start.getTime() + 30 * 60 * 1000);
        const pad = (n) => String(n).padStart(2, '0');
        const toICSDate = (d) =>
          `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

        const uid = `${interviewId}@mern-job-portal`;
        const ics = [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//MERN Job Portal//EN',
          'CALSCALE:GREGORIAN',
          'METHOD:PUBLISH',
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTAMP:${toICSDate(new Date())}`,
          `DTSTART:${toICSDate(start)}`,
          `DTEND:${toICSDate(end)}`,
          `SUMMARY:Interview - ${appDoc.jobTitle}`,
          `DESCRIPTION:Interview scheduled via MERN Job Portal\\nCompany: ${appDoc.companyName}\\nCandidate: ${appDoc.userEmail}`,
          'END:VEVENT',
          'END:VCALENDAR',
        ].join('\r\n');

        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=\"interview-${interviewId}.ics\"`);
        res.send(ics);
      } catch (err) {
        console.error('ICS error:', err.message);
        res.status(500).send({ error: 'Failed to generate ICS' });
      }
    });

    // ===== Referral marketplace =====
    app.post('/referrals/request', verifyJWT, requireRole('seeker'), async (req, res) => {
      try {
        const { jobId, message } = req.body || {};
        if (!jobId) return res.status(400).send({ error: 'jobId required' });
        const job = await jobsCollections.findOne({ _id: new ObjectId(jobId) });
        if (!job) return res.status(404).send({ error: 'Job not found' });

        const referral = {
          jobId: new ObjectId(jobId),
          jobTitle: job.jobTitle,
          companyEmail: job.postedBy,
          seekerEmail: req.user.email,
          status: 'open',
          messages: message ? [{ id: new ObjectId().toString(), senderEmail: req.user.email, senderRole: 'seeker', text: String(message).trim(), at: new Date() }] : [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const result = await referralRequestsCollection.insertOne(referral);
        res.status(201).send({ insertedId: result.insertedId });
      } catch (err) {
        res.status(500).send({ error: 'Failed to create referral request' });
      }
    });

    app.get('/referrals/incoming', verifyJWT, requireRole('company'), async (req, res) => {
      try {
        const rows = await referralRequestsCollection.find({ companyEmail: req.user.email }).sort({ createdAt: -1 }).toArray();
        res.send(rows);
      } catch {
        res.status(500).send({ error: 'Failed to fetch referrals' });
      }
    });

    app.get('/referrals/outgoing', verifyJWT, requireRole('seeker'), async (req, res) => {
      try {
        const rows = await referralRequestsCollection.find({ seekerEmail: req.user.email }).sort({ createdAt: -1 }).toArray();
        res.send(rows);
      } catch {
        res.status(500).send({ error: 'Failed to fetch referrals' });
      }
    });

    app.patch('/referrals/:id/status', verifyJWT, requireRole('company'), async (req, res) => {
      try {
        const id = req.params.id;
        const { status } = req.body || {};
        const valid = ['open', 'accepted', 'rejected', 'referred', 'closed'];
        if (!valid.includes(status)) return res.status(400).send({ error: 'Invalid status' });
        const referral = await referralRequestsCollection.findOne({ _id: new ObjectId(id) });
        if (!referral) return res.status(404).send({ error: 'Referral not found' });
        if (referral.companyEmail !== req.user.email) return res.status(403).send({ error: 'Forbidden' });
        await referralRequestsCollection.updateOne({ _id: new ObjectId(id) }, { $set: { status, updatedAt: new Date() } });
        res.send({ ok: true });
      } catch {
        res.status(500).send({ error: 'Failed to update referral status' });
      }
    });

    app.post('/referrals/:id/messages', verifyJWT, async (req, res) => {
      try {
        const id = req.params.id;
        const { text } = req.body || {};
        if (!text || !String(text).trim()) return res.status(400).send({ error: 'text required' });
        const referral = await referralRequestsCollection.findOne({ _id: new ObjectId(id) });
        if (!referral) return res.status(404).send({ error: 'Referral not found' });
        const isCompany = req.user.role === 'company' && referral.companyEmail === req.user.email;
        const isSeeker = req.user.role === 'seeker' && referral.seekerEmail === req.user.email;
        if (!isCompany && !isSeeker) return res.status(403).send({ error: 'Forbidden' });
        const msg = { id: new ObjectId().toString(), senderEmail: req.user.email, senderRole: req.user.role, text: String(text).trim(), at: new Date() };
        await referralRequestsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $push: { messages: msg }, $set: { updatedAt: new Date() } }
        );
        res.status(201).send({ ok: true, message: msg });
      } catch {
        res.status(500).send({ error: 'Failed to send referral message' });
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
    app.get('/user-profile/:email', verifyJWT, requireRole('seeker'), async (req, res) => {
      try {
        const email = req.params.email;
        if (email !== req.user.email) return res.status(403).send({ error: 'Forbidden' });
        const user = await usersCollection.findOne({ email });
        if (user) {
          // never expose password hash to client
          const { password, ...safe } = user;
          res.send(safe);
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
        if (!req.user || req.user.role !== 'seeker' || req.user.email !== email) {
          return res.status(403).send({ error: 'Forbidden' });
        }
        const update = req.body || {};
        const { out: studentFields, errors } = parseStudentProfileFields(update);
        if (errors.length > 0) return res.status(400).send({ error: errors[0], errors });
        const safeUpdate = {
          ...update,
          ...studentFields,
        };
        delete safeUpdate.password;
        delete safeUpdate._id;
        const result = await usersCollection.updateOne(
          { email },
          { $set: safeUpdate },
          { upsert: true }
        );
        res.send({ success: true, message: 'Profile updated' });
      } catch (err) {
        res.status(500).send({ error: 'Failed to update profile' });
      }
    });

    // Company Profile endpoints
    app.get('/company-profile/:email', verifyJWT, requireRole('company'), async (req, res) => {
      try {
        const email = req.params.email;
        if (email !== req.user.email) return res.status(403).send({ error: 'Forbidden' });
        const company = await companiesCollection.findOne({ email });
        if (company) {
          const { password, ...safe } = company;
          res.send(safe);
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
        if (!req.user || req.user.role !== 'company' || req.user.email !== email) {
          return res.status(403).send({ error: 'Forbidden' });
        }
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

    // Basic admin moderation endpoint (email containing "admin")
    app.get('/admin/reported-jobs', verifyJWT, async (req, res) => {
      try {
        if (!String(req.user?.email || '').includes('admin')) return res.status(403).send({ error: 'Forbidden' });
        const reports = await jobReportsCollection.find({}).sort({ createdAt: -1 }).toArray();
        const jobIds = [...new Set(reports.map((r) => r.jobId).filter(Boolean))];
        const jobs = await jobsCollections.find({ _id: { $in: jobIds } }).toArray();
        const jobMap = new Map(jobs.map((j) => [String(j._id), j]));
        res.send(reports.map((r) => ({ ...r, job: jobMap.get(String(r.jobId)) || null })));
      } catch {
        res.status(500).send({ error: 'Failed to fetch reports' });
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
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });
}

module.exports = app;
