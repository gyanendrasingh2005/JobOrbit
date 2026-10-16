<div align="center">

# 🚀 JobOrbit

### A modern full-stack job portal connecting ambitious talent with top tech companies

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

[Live Demo](#) · [Report Bug](https://github.com/gyanendrasingh2005/JobOrbit/issues) · [Request Feature](https://github.com/gyanendrasingh2005/JobOrbit/issues)

</div>

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Vercel Deployment Guide](#-vercel-deployment-guide)
- [User Roles](#-user-roles)

---

## 🌟 About the Project

**JobOrbit** is a high-performance, full-stack career platform engineered to streamline hiring for both job seekers and recruiters. Inspired by modern job search ecosystems like LinkedIn Jobs, Wellfound, and Indeed, JobOrbit removes traditional clutter—providing instant application workflows, verified company profiles, and transparent status tracking.

Students and job seekers can explore curated technical roles, bookmark opportunities, and submit one-click applications. Recruiters gain full lifecycle control: establishing company profiles, posting structured job listings, and managing applicant pipelines with real-time status decisions.

---

## ✨ Key Features

### 👨‍🎓 Candidate / Job Seeker
- 🔍 **Real-Time Job Search** — Instant query matching across title, skills, company name, and location
- 🎛️ **Multi-Parameter Filtering** — Filter by location, job category, salary bands, and experience level
- 📄 **Rich Job Details** — Markdown-formatted job specs, salary breakdowns, requirements, and single-click apply
- 🔖 **Saved & Bookmarked Jobs** — Bookmark high-priority roles to review and apply anytime
- 👤 **Interactive Profile Management** — Editable bio, skills chips, Cloudinary PDF resume preview, and instant avatar upload
- 📊 **Dynamic Job Seeker Dashboard (`/dashboard`)** — Real-time tracking of applications, pipeline metrics (Total, Under Review, Shortlisted, Interviews, Selected, Rejected)
- 🚀 **Visual Dynamic Timeline** — Step-by-step progress tracking (`Applied → Under Review → Shortlisted → Interview Scheduled → Selected/Rejected`) powered by backend audit history
- 🗓️ **Interview Management & Joining** — Upcoming interview calendar with local timezone support, duration, instructions, and one-click "Join Interview" for video meetings
- 📧 **Automated Email Notifications** — Instant confirmation emails when applying, status updates, interview invitations, and reminders

### 🏢 Recruiter / Employer
- 🏗️ **Company Profile Management** — Register and configure company presence with logos, website URLs, and company descriptions
- 📝 **Structured Job Posting** — Publish detailed job openings including qualifications, role type, salary range, and position quotas
- 📊 **Recruiter Command Dashboard (`/admin/dashboard`)** — Real-time candidate analytics, review queues, and upcoming interview agendas
- ✏️ **Full Job Lifecycle Control** — Edit, update, and manage job visibility and details directly from an administrative table
- 👥 **Applicant Review Pipeline** — Inspect candidate profiles, review uploaded resumes, and filter applications per job listing
- 🚦 **Multi-Stage Status Workflow** — Transition applicants between `Under Review`, `Shortlisted`, `Selected`, and `Rejected` with private internal notes
- 📅 **Interview Scheduling Engine** — Schedule, reschedule, and cancel interviews with date/time, timezone, online/in-person formats, and meeting URLs
- ⏰ **Automated 24h & 1h Reminders** — Background scheduler automatically notifies candidates 24 hours and 1 hour before scheduled interviews without external dependencies
- 🔒 **Role-Guarded Dashboards** — Frontend route protection and backend JWT verification for recruiter-only endpoints

### 🌐 Platform & Architecture
- 📧 **Gmail OAuth2 & Nodemailer Engine** — Reusable transactional email service with branded responsive HTML templates, deduplication, and safe error logging
- 🎨 **Modern Design System** — Tailwind CSS, responsive layouts, glassmorphic accents, and Framer Motion micro-interactions
- 🔐 **Secure JWT Authentication** — Secure token transmission and session handling with `httpOnly` cookies or Bearer headers
- ☁️ **Cloud Media Storage** — Cloudinary integration for resume documents and profile pictures
- ⚡ **Serverless-Optimized Database Layer** — Mongoose connection caching engineered for Vercel serverless cold starts
- 🛡️ **Cross-Origin Security (CORS)** — Automated origin validation supporting local development and `*.vercel.app` preview deployments

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | Modern UI framework |
| **Vite** | Ultra-fast build tool and dev server |
| **Redux Toolkit** | Centralized client state management |
| **React Router v7** | Single-page client-side routing |
| **Tailwind CSS v4** | Modern utility-first styling |
| **Framer Motion** | Component animations and transitions |
| **Axios** | HTTP client with credential forwarding |
| **Shadcn/ui & Radix UI** | Accessible UI primitives and dialogs |
| **Lucide React** | Feather-style icons |
| **Sonner** | Toast notifications |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express** | RESTful API server |
| **MongoDB Atlas + Mongoose** | Cloud document database & schema modeling |
| **JSON Web Tokens (JWT)** | Stateless authentication |
| **bcryptjs** | Salted password hashing |
| **Multer + DataURI** | Memory-buffered file upload pipeline |
| **Cloudinary SDK** | Cloud asset and document hosting |
| **Cookie-Parser** | Secure cookie extraction |
| **dotenv** | Environment configuration management |

---

## 📁 Project Structure

```
JobOrbit/
│
├── Client/                          # React frontend (Vite)
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/               # Recruiter dashboard pages
│   │   │   │   ├── AdminJobs.jsx
│   │   │   │   ├── AdminJobsTable.jsx
│   │   │   │   ├── Companies.jsx
│   │   │   │   ├── CompanyCreate.jsx
│   │   │   │   ├── CompanySetup.jsx
│   │   │   │   ├── EditJob.jsx
│   │   │   │   ├── JobApplicants.jsx
│   │   │   │   ├── PostJob.jsx
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   ├── auth/                # Login & Registration views
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Signup.jsx
│   │   │   ├── shared/              # Global components
│   │   │   │   ├── Navbar.jsx
│   │   │   │   └── Footer.jsx
│   │   │   ├── ui/                  # Reusable UI component library
│   │   │   ├── Home.jsx             # Main landing page
│   │   │   ├── HeroSection.jsx
│   │   │   ├── CompanySlider.jsx
│   │   │   ├── CategorySection.jsx
│   │   │   ├── PlatformFeatures.jsx
│   │   │   ├── HowItWorks.jsx
│   │   │   ├── CtaBanner.jsx
│   │   │   ├── Jobs.jsx             # Filterable job catalog
│   │   │   ├── JobDescription.jsx   # Detailed job view & application
│   │   │   ├── Profile.jsx          # Candidate profile view
│   │   │   └── Browse.jsx           # Categorized role browser
│   │   ├── redux/                   # Redux slices (auth, job, company, application)
│   │   ├── utils/
│   │   │   └── constant.js          # API base endpoints
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── vercel.json                  # SPA routing rewrite configuration
│   └── vite.config.js
│
├── Server/                          # Express REST API (Vercel serverless-ready)
│   ├── controllers/                 # Route controllers (user, job, company, application)
│   ├── middlewares/                 # JWT authentication & file parsing
│   ├── models/                      # Mongoose schemas
│   ├── routes/                      # API endpoint definitions
│   ├── utils/
│   │   ├── db.js                    # Serverless-cached MongoDB connection
│   │   ├── cloudinary.js            # Media upload configuration
│   │   └── datauri.js               # In-memory buffer converter
│   ├── index.js                     # Express app setup and middleware
│   ├── node-compat.cjs              # Compatibility & DNS resolver config
│   ├── vercel.json                  # Serverless function configuration
│   └── .env.example
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)
- A free [MongoDB Atlas](https://www.mongodb.com/atlas/database) account
- A free [Cloudinary](https://cloudinary.com/) account

---

### 1. Clone the Repository

```bash
git clone https://github.com/gyanendrasingh2005/JobOrbit.git
cd JobOrbit
```

---

### 2. Backend Setup (`Server`)

1. Navigate to the server folder:
   ```bash
   cd Server
   npm install
   ```

2. Create a `.env` file from the template:
   ```bash
   cp .env.example .env
   ```

3. Fill in your credentials:
   ```env
   NODE_ENV=development
   PORT=8000
   MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.fjzbtd2.mongodb.net/joborbit"
   SECRET_KEY="your_super_secret_jwt_key"
   CLOUDINARY_API_KEY="your_cloudinary_api_key"
   CLOUDINARY_SECRET_KEY="your_cloudinary_secret_key"
   CLOUDINARY_NAME="your_cloudinary_cloud_name"
   FRONTEND_URL="http://localhost:5173"
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```
   *The backend will boot on `http://localhost:8000`.*

---

### 3. Frontend Setup (`Client`)

1. Open a new terminal and navigate to `Client`:
   ```bash
   cd Client
   npm install
   ```

2. Create a `.env` file from the template:
   ```bash
   cp .env.example .env
   ```

3. Configure your API endpoint:
   ```env
   VITE_BACKEND_URL=http://localhost:8000
   ```

4. Run the frontend development server:
   ```bash
   npm run dev
   ```
   *The client will start on `http://localhost:5173` (or `5174`).*

---

## 🔐 Environment Variables

### Server (`Server/.env`)
| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Environment mode (`development` / `production`) | `development` |
| `PORT` | Local dev server port | `8000` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `SECRET_KEY` | Secret token used to sign authentication JWTs | `random_long_hash` |
| `CLOUDINARY_NAME` | Cloudinary account cloud name | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary access API key | `1234567890` |
| `CLOUDINARY_SECRET_KEY` | Cloudinary API secret | `abcde12345` |
| `FRONTEND_URL` | Production/staging frontend URL for CORS | `https://joborbit.vercel.app` |
| `EMAIL_USER` | Gmail address for sending notifications | `your-company@gmail.com` |
| `CLIENT_ID` | Google Cloud OAuth2 Client ID | `your-google-client-id.apps.googleusercontent.com` |
| `CLIENT_SECRET` | Google Cloud OAuth2 Client Secret | `your-google-client-secret` |
| `REFRESH_TOKEN` | Google Cloud OAuth2 Refresh Token | `1//04your-oauth-refresh-token` |

### Client (`Client/.env`)
| Variable | Description | Example |
|---|---|---|
| `VITE_BACKEND_URL` | Base URL of the API server (no trailing slash) | `http://localhost:8000` |

---

## 📡 API Reference

### User & Authentication (`/api/v1/user`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/register` | Register a new user (`student` or `recruiter`) | No |
| `POST` | `/login` | Authenticate user and issue JWT cookie | No |
| `POST` | `/logout` | Expire authentication cookie | No |
| `POST` | `/profile/update` | Update user details, bio, skills, and resume PDF | Yes |
| `POST` | `/profile/photo` | Update candidate/recruiter avatar image | Yes |
| `POST` | `/bookmark/:id` | Toggle bookmark status on a job | Yes |
| `GET` | `/bookmarks` | Retrieve candidate's bookmarked jobs | Yes |

### Jobs (`/api/v1/job`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/get` | Fetch all active jobs with optional search filters | No |
| `GET` | `/get/:id` | Fetch specific job details and specifications | No |
| `POST` | `/post` | Create a new job listing | Yes (Recruiter) |
| `GET` | `/get-recruiter-job` | Fetch all jobs posted by the logged-in recruiter | Yes (Recruiter) |
| `PUT` | `/update/:id` | Update an existing job opening | Yes (Recruiter) |
| `DELETE` | `/delete/:id` | Remove a job listing | Yes (Recruiter) |

### Companies (`/api/v1/company`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/register` | Register a company profile | Yes (Recruiter) |
| `GET` | `/get` | Fetch all companies created by current recruiter | Yes (Recruiter) |
| `GET` | `/get/:id` | Retrieve single company profile details | Yes (Recruiter) |
| `PUT` | `/update/:id` | Update company information and logo | Yes (Recruiter) |

### Applications (`/api/v1/application`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/apply/:id` | Submit an application for a job (triggers email confirmation) | Yes (Student) |
| `GET` | `/get` | Retrieve all applications submitted by candidate with timeline | Yes (Student) |
| `GET` | `/seeker/stats` | Retrieve candidate dashboard statistics | Yes (Student) |
| `GET` | `/details/:id` | Retrieve application details and full audit history | Yes |
| `GET` | `/recruiter/stats` | Retrieve recruiter dashboard statistics | Yes (Recruiter) |
| `GET` | `/:id/applicants` | Fetch applicants for a specific recruiter's job | Yes (Recruiter) |
| `POST` | `/status/:id/update` | Transition applicant status (`Under Review`, `Shortlisted`, `Selected`, `Rejected`) with notes | Yes (Recruiter) |
| `POST` | `/:id/retry-email` | Retry sending confirmation email upon delivery failure | Yes |

### Interviews (`/api/v1/interview`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/schedule` | Schedule candidate interview (sends email invitation) | Yes (Recruiter) |
| `PUT` | `/:id/reschedule` | Reschedule interview date/time (sends reschedule notice) | Yes (Recruiter) |
| `PUT` | `/:id/cancel` | Cancel interview (sends cancellation notice and clears reminders) | Yes (Recruiter) |
| `GET` | `/my-interviews` | Fetch user's upcoming/past interviews (candidate or recruiter) | Yes |
| `GET` | `/application/:applicationId` | Retrieve interviews for a specific application | Yes |

---

## ☁️ Vercel Deployment Guide

Deploying JobOrbit to Vercel requires two simple deployments from the same repository:

### Step 1: Deploy Backend (`Server`)
1. In the Vercel Dashboard, select **Add New Project** and import this repository.
2. Under **Root Directory**, click edit and select **`Server`**.
3. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = *(Your MongoDB Atlas connection URI)*
   - `SECRET_KEY` = *(Your JWT secret string)*
   - `CLOUDINARY_NAME` = *(Your Cloudinary cloud name)*
   - `CLOUDINARY_API_KEY` = *(Your Cloudinary API key)*
   - `CLOUDINARY_SECRET_KEY` = *(Your Cloudinary secret key)*
4. Click **Deploy**. Vercel will build your serverless backend and provide a URL (e.g., `https://joborbit-server.vercel.app`).

> **Important:** In MongoDB Atlas, ensure your Network Access whitelist includes `0.0.0.0/0` so Vercel's serverless functions can connect.

---

### Step 2: Deploy Frontend (`Client`)
1. In Vercel, click **Add New Project** and choose the same repository.
2. Under **Root Directory**, select **`Client`**.
3. Under **Framework Preset**, select **Vite**.
4. Under **Environment Variables**, add:
   - `VITE_BACKEND_URL` = `https://joborbit-server.vercel.app` *(The backend URL from Step 1, without a trailing slash)*
5. Click **Deploy**. Vercel will build and host your frontend (e.g., `https://joborbit.vercel.app`).

---

### Step 3: Link Frontend Domain in Backend
1. Go to your **Backend Project Settings** on Vercel.
2. Add an environment variable:
   - `FRONTEND_URL` = `https://joborbit.vercel.app`
3. Trigger a redeploy to apply the update.

---

## 👥 User Roles

| Role | Access & Capabilities |
|---|---|
| **Student / Candidate** | Can browse all listings, use smart search & filters, bookmark roles, submit job applications, and customize profile information including resume and avatar. |
| **Recruiter / Admin** | Can register corporate profiles, manage company branding, create and update job postings, review applicant profiles, download resumes, and issue acceptance/rejection decisions. |

---

## 📄 License

Distributed under the [MIT License](LICENSE).

<div align="center">

Built with ❤️ by [Gyanendra Singh](https://github.com/gyanendrasingh2005)

</div>
