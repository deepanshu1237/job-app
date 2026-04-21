# Deploy MERN Job Portal on Vercel

## 1) Deploy backend (`job-portal-server`)

- Create a new Vercel project and set **Root Directory** to `job-portal-server`.
- Framework preset: `Other`.
- Keep build settings default (it uses `vercel.json` + `api/index.js`).
- Add environment variables:
  - `MONGODB_URI`
  - `DB_NAME`
  - `JWT_SECRET`
  - `CORS_ORIGINS` (comma-separated, include your frontend URL and local URLs)
- Deploy and copy backend URL (example: `https://your-api.vercel.app`).

## 2) Deploy frontend (`job-portal-client`)

- Create another Vercel project and set **Root Directory** to `job-portal-client`.
- Framework preset: `Vite`.
- Add environment variable:
  - `VITE_API_BASE_URL=https://your-api.vercel.app`
- Deploy.

## 3) Important note for resume uploads

Current resume files are stored on local disk (`uploads/`). Vercel serverless file storage is temporary, so uploaded files are not persistent there.

For production, move resume storage to Cloudinary, AWS S3, or similar object storage.

