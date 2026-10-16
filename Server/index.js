import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./utils/db.js";
import userRouter from "./routes/user.routes.js";
import companyRouter from "./routes/company.routes.js";
import jobRouter from "./routes/job.routes.js";
import applicantionRouter from "./routes/application.routes.js";
import interviewRouter from "./routes/interview.routes.js";
import { startInterviewScheduler } from "./utils/interviewScheduler.js";
dotenv.config({});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ─── Middlewares ───────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── CORS ──────────────────────────────────────────────────────────────────
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (curl, Postman, mobile apps)
        if (!origin) return callback(null, true);

        // Normalize: strip trailing slash
        const clean = (url) => url.replace(/\/$/, "");
        const incoming = clean(origin);

        const whitelist = [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:3000",
            "https://job-orbit-nobf.vercel.app",
            "https://career-connect-xzga-uz3ziwahf.vercel.app",
            "https://career-connect-xzga.vercel.app",
        ];

        if (process.env.FRONTEND_URL) {
            whitelist.push(clean(process.env.FRONTEND_URL));
        }

        // Allow any localhost port, any *.vercel.app preview deployment, or whitelist entries
        const isLocalhost = /^http:\/\/localhost:\d+$/.test(incoming);
        const isVercelDomain = /^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(incoming);

        if (whitelist.includes(incoming) || isLocalhost || isVercelDomain) {
            callback(null, true);
        } else {
            console.error(`CORS blocked: ${origin}`);
            callback(new Error(`CORS: Origin ${origin} not allowed`));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // pre-flight for all routes

// ─── DB Connection Middleware ──────────────────────────────────────────────
// CRITICAL for Vercel serverless: ensures DB is connected before every request.
// Without this, cold-start requests hit the route handlers before mongoose is ready.
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error("DB connection failed:", err.message);
        res.status(503).json({
            success: false,
            message: "Service unavailable. Database connection failed.",
            error: err.message,
        });
    }
});

// ─── Static Files ──────────────────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── Health check ──────────────────────────────────────────────────────────
app.get("/", (req, res) => {
    res.json({ status: "ok", message: "JobOrbit API is running ✅" });
});

// ─── Routes ────────────────────────────────────────────────────────────────
app.use("/api/v1/user", userRouter);
app.use("/api/v1/company", companyRouter);
app.use("/api/v1/job", jobRouter);
app.use("/api/v1/application", applicantionRouter);
app.use("/api/v1/interview", interviewRouter);
// ─── Global Error Handler ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err.message);
    if (err.name === "MulterError") {
        return res.status(400).json({
            success: false,
            message: err.code === "LIMIT_FILE_SIZE" ? "File too large. Maximum size is 5MB for resumes and 10MB for photos." : err.message,
        });
    }
    const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
    return res.status(statusCode).json({
        success: false,
        message: err.message || "An unexpected server error occurred",
    });
});

// ─── Local dev server ──────────────────────────────────────────────────────
const PORT = process.env.PORT || 8000;
if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
    app.listen(PORT, async () => {
        console.log(`Server running at port ${PORT}`);
        try {
            await connectDB();
            startInterviewScheduler();
        } catch (err) {
            console.error("Failed to connect to MongoDB on startup:", err.message);
        }
    });
} else if (process.env.NODE_ENV === "production") {
    // In production environments (including container/server runtimes)
    connectDB()
        .then(() => startInterviewScheduler())
        .catch((err) => console.error("Production DB connection error on startup:", err.message));
}

// ─── Export for Vercel serverless ─────────────────────────────────────────
export default app;
