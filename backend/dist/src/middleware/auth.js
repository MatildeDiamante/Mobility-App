"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.authorize = authorize;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Reads and validates JWT_SECRET
const jwtSecret = process.env.JWT_SECRET ?? "";
if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
}
// Middleware verifies if the user is logged in
function authenticate(request, response, next) {
    // Reads token from cookie
    const token = request.cookies?.accessToken;
    // Checks if the token exists
    if (!token) {
        response.status(401).json({ message: "Authentication required" });
        return;
    }
    // Verifies JWT token
    try {
        request.user = jsonwebtoken_1.default.verify(token, jwtSecret);
        next();
    }
    catch {
        response.status(401).json({ message: "Invalid or expired token" });
    }
}
function authorize(...roles) {
    // Return a Middleware
    return (request, response, next) => {
        // Checks if the user is authenticated
        if (!request.user) {
            response.status(403).json({ message: "Forbidden" });
            return;
        }
        // Extract user's role
        const userRole = request.user.role;
        // Check if the role is in the authorized roles list
        const isAuthorized = roles.includes(userRole);
        if (!isAuthorized) {
            response.status(403).json({ message: "Forbidden" });
            return;
        }
        // If everything is allright, it goes to the next middleware
        next();
    };
}
