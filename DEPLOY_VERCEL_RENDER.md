# Deploy MERN Job Portal (Frontend on Vercel, Backend on Render)

## 1) Deploy backend on Render

- Go to Render and create a new **Web Service** from this repo.
- Set **Root Directory** to `job-portal-server`.
- Build command: `npm install`
- Start command: `npm start`
- Add environment variables:
  - `MONGODB_URI`
  - `DB_NAME`
  - `JWT_SECRET`
  - `CORS_ORIGINS` (comma-separated list including your frontend URL)
- Deploy and copy backend URL (example: `https://job-app-backend.onrender.com`).

## 2) Deploy frontend on Vercel

- Create a Vercel project with **Root Directory** = `job-portal-client`.
- Framework preset: `Vite`.
- Add environment variable:
  - `VITE_API_BASE_URL=https://<your-render-backend-domain>`
- Deploy frontend.

## 3) Update backend CORS after frontend URL is live

- In Render backend env vars, set:
  - `CORS_ORIGINS=https://<your-frontend-vercel-domain>,http://localhost:5173`
- Redeploy backend.

## 4) Important note for resume uploads

Resumes are currently stored on local disk (`uploads/`).
On Render free instances, local storage is ephemeral and can be cleared on restart/redeploy.
Use Cloudinary, S3, or another object storage for persistent files.

