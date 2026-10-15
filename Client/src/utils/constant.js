const configuredBackendUrl = 
  import.meta.env.VITE_BACKEND_URL?.trim() || "https://job-orbit-zeta.vercel.app";

const backend_url = configuredBackendUrl.replace(/\/$/, "");
export const USER_API_END_POINT = `${backend_url}/api/v1/user`;
export const JOB_API_END_POINT = `${backend_url}/api/v1/job`;
export const APPLICANT_API_END_POINT = `${backend_url}/api/v1/application`;
export const COMPANY_API_END_POINT = `${backend_url}/api/v1/company`;

// export const USER_API_END_POINT = "http://localhost:8000/api/v1/user"
// export const JOB_API_END_POINT = "http://localhost:8000/api/v1/job"
// export const APPLICANT_API_END_POINT = "http://localhost:8000/api/v1/application"
// export const COMPANY_API_END_POINT = "http://localhost:8000/api/v1/company"
