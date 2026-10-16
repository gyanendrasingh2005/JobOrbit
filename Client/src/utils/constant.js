const getBackendUrl = () => {
  const envUrl = import.meta.env.VITE_BACKEND_URL?.trim();
  // If running locally in browser (localhost / 127.0.0.1)
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    // If envUrl is explicitly set to a localhost port, keep it; if not set or points to remote vercel, route to local server
    if (!envUrl || envUrl.includes("vercel.app")) {
      return "http://localhost:8000";
    }
  }
  return envUrl || "http://localhost:8000";
};

const backend_url = getBackendUrl().replace(/\/$/, "");
export const BACKEND_URL = backend_url;
export const USER_API_END_POINT = `${backend_url}/api/v1/user`;
export const JOB_API_END_POINT = `${backend_url}/api/v1/job`;
export const APPLICANT_API_END_POINT = `${backend_url}/api/v1/application`;
export const COMPANY_API_END_POINT = `${backend_url}/api/v1/company`;
export const INTERVIEW_API_END_POINT = `${backend_url}/api/v1/interview`;

export const resolveResumeUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${backend_url}${url.startsWith("/") ? "" : "/"}${url}`;
};
