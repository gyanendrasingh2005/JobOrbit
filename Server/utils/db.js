import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Cache the connection across serverless function calls
let cached = global.mongoose;
if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    // Return existing connection if available
    if (cached.conn) {
        return cached.conn;
    }

    // Reuse pending connection promise if one exists
    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 10000,
        };

        cached.promise = mongoose
            .connect(process.env.MONGODB_URI, opts)
            .then((mongoose) => {
                console.log("MongoDB Connected...");
                return mongoose;
            })
            .catch((err) => {
                cached.promise = null;
                console.error("MongoDB connection error:", err.message);
                throw err;
            });
    }

    try {
        cached.conn = await cached.promise;
    } catch (err) {
        cached.promise = null;
        throw err;
    }

    return cached.conn;
};

export default connectDB;