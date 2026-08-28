const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Middleware
const app = express();

app.use(cors()); // Handles requests from the frontend
app.use(express.json()); // Handles JSON requests

// MongoDB connection
const mongoUri =
  process.env.MONGODB_URI || "mongodb://mongo_mobility:27017/mydatabase";
mongoose
  .connect(mongoUri)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Definition of the basic routes
// GET endpoints
app.get("/api/health", (req, res) => {
  res.json({ status: "Backend is running", timestamp: new Date() });
});

app.get("/api/mobility", (req, res) => {
  res.json({ message: "Welcome to Mobility App API" });
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
