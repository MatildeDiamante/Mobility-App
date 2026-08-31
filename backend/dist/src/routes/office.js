"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Routes for office staff
const express_1 = require("express");
const applications_1 = require("../../mongodbModels/applications");
const auth_1 = require("../middleware/auth");
const userRole_1 = require("../../mongodbModels/userRole");
const router = (0, express_1.Router)();
// GET /api/office/applications
// Office staff can see all applications
router.get("/applications", auth_1.authenticate, (0, auth_1.authorize)(userRole_1.UserRole.OFFICE_STAFF), async (request, response) => {
    try {
        // Get all applications with optional filtering by status
        const { status } = request.query;
        let query = {};
        if (status) {
            query.status = status;
        }
        const applications = await applications_1.Applications.find(query).populate("student hostUniversity referentProfessor homeCourses hostCourses");
        response.json(applications);
    }
    catch (error) {
        response
            .status(500)
            .json({ message: "Failed to fetch applications", error });
    }
});
// PATCH /api/office/applications/:id/verify
// Office staff verifies an application that was already approved by the professor
router.patch("/applications/:id/verify", auth_1.authenticate, (0, auth_1.authorize)(userRole_1.UserRole.OFFICE_STAFF), async (request, response) => {
    try {
        const { comment } = request.body;
        const application = await applications_1.Applications.findById(request.params.id);
        if (!application) {
            response.status(404).json({ message: "Application not found" });
            return;
        }
        // Check if the application is in "professor_approved" status
        if (application.status !== applications_1.ApplicationStatus.PROFESSOR_APPROVED) {
            response.status(400).json({
                message: "Can only verify applications approved by the professor",
            });
            return;
        }
        // Final checks before closing the application:
        // 1. Learning Agreement must have been approved.
        // 2. Transcript of Records must have been approved by the referent professor.
        // 3. All passed exams must be accepted by the professor.
        const hasLearningAgreementApproved = application.learningAgreementApproved === true;
        const hasTranscriptApproved = application.transcriptApproved === true;
        const hasApprovedExams = Array.isArray(application.passedHostCourses) &&
            application.passedHostCourses.length > 0 &&
            application.passedHostCourses.every((exam) => exam.status === "approved");
        const isComplete = hasLearningAgreementApproved &&
            hasTranscriptApproved &&
            hasApprovedExams &&
            Boolean(application.academicYear) &&
            Boolean(application.hostUniversity) &&
            Boolean(application.duration) &&
            Boolean(application.referentProfessor) &&
            Array.isArray(application.homeCourses) &&
            application.homeCourses.length === 3 &&
            Array.isArray(application.hostCourses) &&
            application.hostCourses.length === 3;
        if (!isComplete) {
            response.status(400).json({
                message: "Application cannot be marked as completed: missing required fields, learning agreement not approved, transcript not approved, or exams not accepted",
            });
            return;
        }
        // Update the application status and add office comment and verification date
        application.status = applications_1.ApplicationStatus.COMPLETED;
        application.officeComment =
            comment || "Application verififed and closed by office staff";
        //application.learningAgreementApproved = true;
        application.officeVerificationDate = new Date();
        /*if (comment) {
          application.officeComment = comment;
        } */
        /* Automatically set the office's verification date
        application.officeVerificationDate = new Date(); */
        await application.save();
        response.json({
            message: "Application completed successfully",
            application,
        });
    }
    catch (error) {
        response.status(400).json({
            message: "Failed to verify application",
            error,
        });
    }
});
exports.default = router;
