"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Routes for getting lists of data (universities, professors, courses)
const express_1 = require("express");
const universities_1 = require("../../mongodbModels/universities");
const professors_1 = require("../../mongodbModels/professors");
const exams_1 = require("../../mongodbModels/exams");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/lists/universities
// Get all host universities
router.get("/universities", auth_1.authenticate, async (_request, response) => {
    try {
        const universities = await universities_1.HostUniversities.find().sort({ name: 1 });
        response.json(universities);
    }
    catch (error) {
        response
            .status(500)
            .json({ message: "Failed to fetch universities", error });
    }
});
// GET /api/lists/professors
// Get all referent professors
router.get("/professors", auth_1.authenticate, async (_request, response) => {
    try {
        // Get only professors who are marked as referents
        const professors = await professors_1.Professors.find({ isReferent: true }).sort({
            fullName: 1,
        });
        response.json(professors);
    }
    catch (error) {
        response.status(500).json({ message: "Failed to fetch professors", error });
    }
});
// GET /api/lists/courses?type=home
// GET /api/lists/courses?type=host
// Get courses by type (home = Ca' Foscari, host = foreign university)
router.get("/courses", auth_1.authenticate, async (request, response) => {
    try {
        const { type } = request.query;
        let query = {};
        // Filter by course type if provided
        if (type === "home") {
            query.type = exams_1.CourseType.HOME;
        }
        else if (type === "host") {
            query.type = exams_1.CourseType.HOST;
        }
        else if (type) {
            // If type is provided but not valid, return error
            response.status(400).json({
                message: "Type must be 'home' or 'host'",
            });
            return;
        }
        const courses = await exams_1.Courses.find(query).populate("hostUniversity").sort({
            name: 1,
        });
        response.json(courses);
    }
    catch (error) {
        response.status(500).json({ message: "Failed to fetch courses", error });
    }
});
exports.default = router;
