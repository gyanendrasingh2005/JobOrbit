import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import userRouter from "./routes/user.routes.js";
import companyRouter from "./routes/company.routes.js";
import jobRouter from "./routes/job.routes.js";
import applicantionRouter from "./routes/application.routes.js";
dotenv.config({});

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

// ─── Health check ──────────────────────────────────────────────────────────
app.get("/", (req, res) => {
    res.json({ status: "ok", message: "JobOrbit API is running ✅" });
});

// ─── Routes ────────────────────────────────────────────────────────────────
app.use("/api/v1/user", userRouter);
app.use("/api/v1/company", companyRouter);
app.use("/api/v1/job", jobRouter);
app.use("/api/v1/application", applicantionRouter);

// ─── Local dev server ──────────────────────────────────────────────────────
const PORT = process.env.PORT || 8000;
if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => {
        console.log(`Server running at port ${PORT}`);
    });
}

// ─── Export for Vercel serverless ─────────────────────────────────────────
export default app;
