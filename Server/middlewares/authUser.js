import jwt from "jsonwebtoken";

const authUser = async (req, res, next) => {
    try {

        let token = req.cookies?.token;

        if (!token && req.headers.authorization) {
            if (req.headers.authorization.startsWith("Bearer ")) {
                token = req.headers.authorization.split(" ")[1];
            } else {
                token = req.headers.authorization;
            }
        }

        if (!token) {
            return res.status(401).json({
                message: "User not authorized",
                success: false,
            })
        }

        const decode = await jwt.verify(token, process.env.SECRET_KEY);

        if (!decode) {
            return res.status(401).json({
                message: "Invalid token",
                success: false,
            })
        }

        req.id = decode.userId;

        next();
    } catch (error) {
        console.error("Authentication failed:", error.message);
        return res.status(401).json({
            message: "Invalid or expired authentication token",
            success: false,
        });
    }
}


export default authUser;