// Express configuration
import cors from "cors";
import express from "express";
import helmet from "helmet"; // Helmet helps make Node/Express apps more secure

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
