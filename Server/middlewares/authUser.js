import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const authUser = async (req, res, next) => {
    try {
        let token = null;

        // 1. Prefer Authorization header (Bearer token)
        if (req.headers.authorization) {
            if (req.headers.authorization.startsWith("Bearer ")) {
                token = req.headers.authorization.split(" ")[1]?.trim();
            } else {
                token = req.headers.authorization.trim();
            }
        }

        // 2. Fallback to cookie
        if (!token || token === "null" || token === "undefined") {
            token = req.cookies?.token;
        }

        // 3. Fallback to query param (e.g. for opening resume in new tab)
        if (!token || token === "null" || token === "undefined") {
            token = req.query?.token;
        }

        if (token) {
            token = token.replace(/^["']|["']$/g, "").trim();
        }

        if (!token || token === "null" || token === "undefined") {
            return res.status(401).json({
                message: "Authentication required. Please log in to proceed.",
                isAuthError: true,
                success: false,
            });
        }

        let decode = null;
        try {
            decode = await jwt.verify(token, process.env.SECRET_KEY);
        } catch (primaryErr) {
            // If header token was expired/invalid, try cookie if different
            let cookieToken = req.cookies?.token;
            if (cookieToken) {
                cookieToken = cookieToken.replace(/^["']|["']$/g, "").trim();
            }
            if (cookieToken && cookieToken !== token) {
                try {
                    decode = await jwt.verify(cookieToken, process.env.SECRET_KEY);
                } catch (_) {
                    throw primaryErr;
                }
            } else {
                throw primaryErr;
            }
        }

        if (!decode || !decode.userId) {
            return res.status(401).json({
                message: "Invalid authentication token. Please log in again.",
                isAuthError: true,
                success: false,
            });
        }

        const user = await User.findById(decode.userId).select("_id fullname email role");
        if (!user) {
            return res.status(401).json({
                message: "User account no longer exists. Please log in again.",
                isAuthError: true,
                success: false,
            });
        }

        req.id = decode.userId;
        req.user = user;
        next();
    } catch (error) {
        console.error("Authentication failed:", error.name, error.message);
        const isExpired = error.name === "TokenExpiredError";
        return res.status(401).json({
            message: isExpired
                ? "Your session has expired. Please log in again."
                : "Invalid or expired authentication token",
            isAuthError: true,
            expired: isExpired,
            success: false,
        });
    }
};

export default authUser;