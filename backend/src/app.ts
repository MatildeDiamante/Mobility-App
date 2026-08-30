// Express configuration
import cors from "cors";
import express from "express";
import helmet from "helmet"; // Helmet helps make Node/Express apps more secure
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth";
import applicationsRouter from "./routes/applications";
import professorsRouter from "./routes/professors";
import officeRouter from "./routes/office";
import listsRouter from "./routes/lists";

export const app = express();

// Middleware helmet
app.use(helmet());

// Middleware cors
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http:localhost:4200",
    credentials: true, // with this Angular sends JWT cookies
  }),
);

// Middleware that analyses JSON HTTP requests
app.use(express.json());

// Middleware cookies
app.use(cookieParser());

// Authentication route
app.use("/api/auth", authRouter);
app.use("/api/applications", applicationsRouter);
app.use("/api/professor", professorsRouter);
app.use("/api/office", officeRouter);
app.use("/api/lists", listsRouter);

// Endpoints:
// to check if the backend is active
app.get("/api/health", (_request, response) => {
  response.json({
    status: "Backend is running",
    timestamp: new Date().toISOString(),
  });
});

// to check if the API works
app.get("/api/mobility", (_request, response) => {
  response.json({
    message: "Welcome to the Mobility App API",
  });
});
