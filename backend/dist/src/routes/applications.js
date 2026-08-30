"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Upload PDF and application creation
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const applications_1 = require("../../mongodbModels/applications");
const auth_1 = require("../middleware/auth");
const userRole_1 = require("../../mongodbModels/userRole");
const router = (0, express_1.Router)();
// Configuration of multer for the PDF upload
const upload = (0, multer_1.default)({
    dest: "uploads/",
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
    },
    fileFilter: (_request, file, callback) => {
        //Checks that the file is a PDF
        if (file.mimetype !== "application/pdf") {
            callback(new Error("Only PDF files are allowed"));
            return;
        }
        callback(null, true);
    },
});
// POST /api/applications
// Creates a new application
router.post("/", auth_1.authenticate, (0, auth_1.authorize)(userRole_1.UserRole.STUDENT), upload.single("document"), async (request, response) => {
    try {
        if (!request.file) {
            response
                .status(400)
                .json({ message: "Learning Agreement is required" });
            return;
        }
        // Creates the application with the data received
        const application = await applications_1.Applications.create({
            student: request.user.userId,
            academicYear: request.body.academicYear,
            hostUniversity: request.body.hostUniversity,
            duration: request.body.duration,
            referentProfessor: request.body.referentProfessor,
            homeCourses: JSON.parse(request.body.homeCourses),
            hostCourses: JSON.parse(request.body.hostCourses),
            documentPath: request.file.path,
        });
        response.status(201).json(application);
    }
    catch (error) {
        response
            .status(400)
            .json({ message: "Failed to create application", error });
    }
});
// GET /api/applications/me
// Student can read its own application
router.get("/me", auth_1.authenticate, (0, auth_1.authorize)(userRole_1.UserRole.STUDENT), async (request, response) => {
    try {
        const application = await applications_1.Applications.findOne({
            student: request.user.userId,
        }).populate("hostUniversity referentProfessor homeCourses hostCourses");
        if (!application) {
            response.status(404).json({ message: "Application not found" });
            return;
        }
        response.json(application);
    }
    catch (error) {
        response
            .status(500)
            .json({ message: "Failed to fetch application", error });
    }
});
// PATCH /api/applications/me
// Student can modify its own application
router.patch("/me", auth_1.authenticate, (0, auth_1.authorize)(userRole_1.UserRole.STUDENT), async (request, response) => {
    try {
        const application = await applications_1.Applications.findOne({
            student: request.user.userId,
        });
        if (!application) {
            response.status(404).json({ message: "Application not found" });
            return;
        }
        // Checks if the application is still on "submitted"
        if (application.status !== applications_1.ApplicationStatus.SUBMITTED) {
            response.status(400).json({
                message: "Can only modify application in submitted status",
            });
            return;
        }
        // Update sections
        application.academicYear =
            request.body.academicYear || application.academicYear;
        application.hostUniversity =
            request.body.hostUniversity || application.hostUniversity;
        application.duration = request.body.duration || application.duration;
        application.referentProfessor =
            request.body.referentProfessor || application.referentProfessor;
        if (request.body.homeCourses) {
            application.homeCourses = JSON.parse(request.body.homeCourses);
        }
        if (request.body.hostCourses) {
            application.hostCourses = JSON.parse(request.body.hostCourses);
        }
        await application.save();
        response.json(application);
    }
    catch (error) {
        response
            .status(400)
            .json({ message: "Failed to upload application, error" });
    }
});
// GET /api/applications/:id
// Professor can see applications where he is the referent
// Staff can see any application
router.get("/:id", auth_1.authenticate, async (request, response) => {
    try {
        const application = await applications_1.Applications.findById(request.params.id).populate("student hostUniversity referentProfessor homeCourses hostCourses");
        if (!application) {
            response.status(404).json({ message: "Application not found" });
            return;
        }
        // Check permissions based on user role
        const isProfessor = request.user.role === userRole_1.UserRole.PROFESSOR;
        const isStaff = request.user.role === userRole_1.UserRole.OFFICE_STAFF;
        // Professor can see only applications where he is the referent
        const isReferent = application.referentProfessor._id.toString() === request.user.userId;
        if (isProfessor && !isReferent) {
            response.status(403).json({ message: "Forbidden" });
            return;
        }
        if (!isProfessor && !isStaff) {
            response.status(403).json({ message: "Forbidden" });
            return;
        }
        response.json(application);
    }
    catch (error) {
        response
            .status(500)
            .json({ message: "Failed to fetch application", error });
    }
});
// GET /api/applications/:id/document
// PDF download - permissions: student (owner), professor (referent), staff (all)
router.get("/:id/document", auth_1.authenticate, async (request, response) => {
    try {
        const application = await applications_1.Applications.findById(request.params.id);
        if (!application) {
            response.status(404).json({ message: "Application not found" });
            return;
        }
        // Check permissions based on user role
        const isStudent = request.user.role === userRole_1.UserRole.STUDENT;
        const isProfessor = request.user.role === userRole_1.UserRole.PROFESSOR;
        const isStaff = request.user.role === userRole_1.UserRole.OFFICE_STAFF;
        // Student can download only his own application
        const isOwner = application.student.toString() === request.user.userId;
        // Professor can download applications where he is the referent
        const isReferent = application.referentProfessor.toString() === request.user.userId;
        // Check if user has permission
        const hasPermission = (isStudent && isOwner) || (isProfessor && isReferent) || isStaff;
        if (!hasPermission) {
            response.status(403).json({ message: "Forbidden" });
            return;
        }
        response.download(application.documentPath);
    }
    catch (error) {
        response
            .status(500)
            .json({ message: "Failed to download document", error });
    }
});
exports.default = router;
