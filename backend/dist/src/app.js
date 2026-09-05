"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
// Express configuration
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet")); // Helmet helps make Node/Express apps more secure
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_1 = __importDefault(require("./routes/auth"));
const applications_1 = __importDefault(require("./routes/applications"));
const professors_1 = __importDefault(require("./routes/professors"));
const office_1 = __importDefault(require("./routes/office"));
const lists_1 = __importDefault(require("./routes/lists"));
exports.app = (0, express_1.default)();
// Middleware helmet
exports.app.use((0, helmet_1.default)());
// Middleware cors
exports.app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL ?? "http://localhost:4200",
    credentials: true, // with this Angular sends JWT cookies
}));
// Middleware that analyses JSON HTTP requests
exports.app.use(express_1.default.json());
// Middleware cookies
exports.app.use((0, cookie_parser_1.default)());
// Authentication route
exports.app.use("/api/auth", auth_1.default);
exports.app.use("/api/applications", applications_1.default);
exports.app.use("/api/professor", professors_1.default);
exports.app.use("/api/office", office_1.default);
exports.app.use("/api/lists", lists_1.default);
// Endpoints:
// to check if the backend is active
exports.app.get("/api/health", (_request, response) => {
    response.json({
        status: "Backend is running",
        timestamp: new Date().toISOString(),
    });
});
// to check if the API works
exports.app.get("/api/mobility", (_request, response) => {
    response.json({
        message: "Welcome to the Mobility App API",
    });
});
