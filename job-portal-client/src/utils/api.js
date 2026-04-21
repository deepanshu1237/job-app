const explicitBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const isVercelHostedFrontend =
  typeof window !== "undefined" && window.location.hostname.endsWith("vercel.app");

// Safe fallback so production frontend always hits deployed backend
// even if Vercel env variable is missing/misconfigured.
export const API_BASE_URL =
  explicitBaseUrl ||
  (isVercelHostedFrontend
    ? "https://jobapp-qrae.onrender.com"
    : "http://localhost:3000");

export const apiUrl = (path) => `${API_BASE_URL}${path}`;

