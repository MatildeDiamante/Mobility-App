import "dotenv/config";
import mongoose from "mongoose";
import { app } from "./app";
import { seedDatabase } from "./seed";

const port = Number(process.env.PORT ?? 8080);
const mongoUri =
  process.env.MONGODB_URI ?? "mongodb://localhost:27017/mydatabase";

async function startServer(): Promise<void> {
  try {
    // Connection to MongoDB
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Populate the database with the test data
    await seedDatabase();

    // Start server
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Unable to start server", error);
    process.exit(1);
  }
}

void startServer();
