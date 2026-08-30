"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = require("./app");
const seed_1 = require("./seed");
const port = Number(process.env.PORT ?? 8080);
const mongoUri = process.env.MONGODB_URI ?? "mongodb://localhost:27017/mydatabase";
async function startServer() {
    try {
        // Connection to MongoDB
        await mongoose_1.default.connect(mongoUri);
        console.log("Connected to MongoDB");
        // Populate the database with the test data
        await (0, seed_1.seedDatabase)();
        // Start server
        app_1.app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    }
    catch (error) {
        console.error("Unable to start server", error);
        process.exit(1);
    }
}
void startServer();
