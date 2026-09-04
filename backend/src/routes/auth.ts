// Endpoints
import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Users } from "../../mongodbModels/users";
import { AuthenticatedRequest, authenticate } from "../middleware/auth";
import { UserRole } from "../../mongodbModels/userRole";

const router = Router();
const jwtSecret = process.env.JWT_SECRET ?? "";

// POST /api/auth/login
router.post("/login", async (request, response) => {
  try {
    const { email, password } = request.body;

    // Checks if the user exist
    const user = await Users.findOne({ email });
    if (!user) {
      response.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Checks if password is correct
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      response.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Creates JWT
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
      },
      jwtSecret,
      { expiresIn: "1h" },
    );

    // Sends token to the cookie
    response.cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    response.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    response.status(500).json({ message: "Login failed", error });
  }
});

// POST /api/auth/logout
router.post("/logout", (request, response) => {
  response.clearCookie("accessToken");
  response.json({ message: "Logged out successfully" });
});

// GET /api/auth/me
router.get(
  "/me",
  authenticate,
  async (request: AuthenticatedRequest, response: Response) => {
    try {
      const user = await Users.findById(request.user!.userId);

      if (!user) {
        response.status(401).json({
          message: "User not found",
        });
        return;
      }
      response.json({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      });
    } catch {
      response.status(500).json({
        message: "Unable to load the current user",
      });
    }
  },
);

export default router;
