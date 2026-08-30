"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Routes for professors
const express_1 = require("express");
const applications_1 = require("../../mongodbModels/applications");
const auth_1 = require("../middleware/auth");
const userRole_1 = require("../../mongodbModels/userRole");
const router = (0, express_1.Router)();
// GET /api/professor/applications
// Professor can see only applications where he/she is the referent professor
router.get("/applications", auth_1.authenticate, (0, auth_1.authorize)(userRole_1.UserRole.PROFESSOR), async (request, response) => {
    try {
        // Get all applications where this professor is the referent
        const applications = await applications_1.Applications.find({
            referentProfessor: request.user.userId,
        }).populate("student hostUniversity homeCourses hostCourses");
        response.json(applications);
    }
    catch (error) {
        response
            .status(500)
            .json({ message: "Failed to fetch applications", error });
    }
});
// PATCH /api/professor/applications/:id/decision
// Professor can approve or reject an application
router.patch("/applications/:id/decision", auth_1.authenticate, (0, auth_1.authorize)(userRole_1.UserRole.PROFESSOR), async (request, response) => {
    try {
        const { decision, comment } = request.body;
        // Validate decision parameter
        if (!decision || !["approve", "reject"].includes(decision)) {
            response.status(400).json({
                message: "Decision must be 'approve' or 'reject'",
            });
            return;
        }
        const application = await applications_1.Applications.findById(request.params.id);
        if (!application) {
            response.status(404).json({ message: "Application not found" });
            return;
        }
        // Check if the professor is the referent of this application
        if (application.referentProfessor.toString() !== request.user.userId) {
            response.status(403).json({ message: "Forbidden" });
            return;
        }
        // Check if the application is still in "submitted" status
        if (application.status !== applications_1.ApplicationStatus.SUBMITTED) {
            response.status(400).json({
                message: "Can only decide on applications in submitted status",
            });
            return;
        }
        // Update the application status and add professor's comment and decision date
        if (decision === "approve") {
            application.status = applications_1.ApplicationStatus.PROFESSOR_APPROVED;
        }
        else {
            application.status = applications_1.ApplicationStatus.PROFESSOR_REJECTED;
        }
        if (comment) {
            application.professorComment = comment;
        }
        // Automatically set the professor's decision date
        application.professorDecisionDate = new Date();
        await application.save();
        response.json({
            message: `Application ${decision}ed successfully`,
            application,
        });
    }
    catch (error) {
        response.status(400).json({
            message: "Failed to update application decision",
            error,
        });
    }
});
exports.default = router;
