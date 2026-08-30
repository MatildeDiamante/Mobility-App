"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Endpoints
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const users_1 = require("../../mongodbModels/users");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const jwtSecret = process.env.JWT_SECRET ?? "";
// POST /api/auth/login
router.post("/login", async (request, response) => {
    try {
        const { email, password } = request.body;
        // Checks if the user exist
        const user = await users_1.Users.findOne({ email });
        if (!user) {
            response.status(401).json({ message: "Invalid credentials" });
            return;
        }
        // Checks if password is correct
        const passwordMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!passwordMatch) {
            response.status(401).json({ message: "Invalid credentials" });
            return;
        }
        // Creates JWT
        const token = jsonwebtoken_1.default.sign({
            userId: user._id.toString(),
            role: user.role,
        }, jwtSecret, { expiresIn: "1h" });
        // Sends token to the cookie
        response.cookie("accessToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 1000, // 1 hour
        });
        response.json({
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        response.status(500).json({ message: "Login failed", error });
    }
});
// POST /api/auth/logout
router.post("/logout", (request, response) => {
    response.clearCookie("accessToken");
    response.json({ message: "Logged out successfully" });
});
// GET /api/auth/me
router.get("/me", auth_1.authenticate, (request, response) => {
    response.json({
        userId: request.user.userId,
        role: request.user.role,
    });
});
exports.default = router;
