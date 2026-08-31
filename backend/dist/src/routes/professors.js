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
// GET /api/professor/applications
// the referent professor reviews the transcript of records
// uploaded by the student
router.patch("/applications/:id/transcript/review", auth_1.authenticate, (0, auth_1.authorize)(userRole_1.UserRole.PROFESSOR), async (request, response) => {
    try {
        const { approved, comment, approvedHostCourses } = request.body;
        // Checks that application exists
        const application = await applications_1.Applications.findById(request.params.id);
        if (!application) {
            return response.status(404).json({ message: "Application not found" });
        }
        // Verifyes that the professor is the referent
        if (application.referentProfessor.toString() !== request.user.userId) {
            return response.status(403).json({ message: "Forbidden" });
        }
        // Checks if the transcription was uploaded
        if (!application.transcriptDocumentPath) {
            return response.status(400).json({
                message: "The student has not uploaded a Transcript of Records yet",
            });
        }
        // Professor's decision and esplanation
        application.transcriptApproved = Boolean(approved);
        application.transcriptReviewDate = new Date();
        application.transcriptComment = comment || "";
        // If approved, stores the passed courses
        if (approved) {
            application.approvedHostCourses = approvedHostCourses || [];
            application.approvedHomeCourses =
                approvedHostCourses || application.hostCourses;
        }
        else {
            application.approvedHostCourses = [];
            application.approvedHomeCourses = [];
        }
        await application.save();
        // updated application with the final review decision
        response.json({
            message: approved
                ? "Transcript approved successfully"
                : "Transcript rejected",
            application,
        });
    }
    catch (error) {
        response
            .status(400)
            .json({ message: "Failed to review Transcript of Records", error });
    }
});
// PATCH /api/professor/applications/:id/exams
// Professor reviews exams taken and scores
router.patch("/applications/:id/exams/review", auth_1.authenticate, (0, auth_1.authorize)(userRole_1.UserRole.PROFESSOR), async (request, response) => {
    try {
        const { approvedExams, comment } = request.body;
        // Checks if application exists
        const application = await applications_1.Applications.findById(request.params.id);
        if (!application) {
            return response.status(404).json({ message: "Application not found" });
        }
        // Checks whether professor is a referent
        if (application.referentProfessor.toString() !== request.user.userId) {
            return response.status(403).json({ message: "Forbidden" });
        }
        if (!application.passedHostCourses) {
            return response
                .status(400)
                .json({ message: "No passed exams to review" });
        }
        // Professor can approve or reject taken exams and scores
        application.passedHostCourses = application.passedHostCourses.map((exam) => {
            const isApproved = approvedExams?.includes(exam.course.toString());
            return {
                ...exam,
                status: isApproved ? "approved" : "rejected",
                comment: isApproved
                    ? comment || "Exam approved by referent professor"
                    : comment || "Exam rejected by referent professor",
            };
        });
        application.transcriptApproved =
            application.passedHostCourses.every((exam) => exam.status === "approved") || application.passedHostCourses.length === 0;
        application.transcriptReviewDate = new Date();
        application.transcriptComment = comment || "";
        application.status = applications_1.ApplicationStatus.WAITING_FOR_EXAM_SCORE_APPROVAL;
        await application.save();
        response.json({
            message: "Passed exams reviewed successfully",
            application,
        });
    }
    catch (error) {
        response
            .status(400)
            .json({ message: "Failed to review passed exams", error });
    }
});
// PATCH /api/professor/applications/:id/decision
// Professor can approve or reject an application
router.patch("/applications/:id/decision", auth_1.authenticate, (0, auth_1.authorize)(userRole_1.UserRole.PROFESSOR), async (request, response) => {
    try {
        const { decision, comment } = request.body;
        // Professors can validate an application using the following parameters
        const validDecisions = [
            "approve",
            "reject",
            "approve_changes",
            "reject_changes",
        ];
        if (!decision || !validDecisions.includes(decision)) {
            response.status(400).json({
                message: "Decision must be 'approve' or 'reject', 'approve_changes' or 'reject_changes'",
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
        // Check if the application is still in the initial created status
        if (["approve", "reject"].includes(decision)) {
            if (application.status !== applications_1.ApplicationStatus.CREATED) {
                response.status(400).json({
                    message: "Can only decide on applications in created status",
                });
                return;
            }
            // Update the application status and add professor's comment and decision date
            if (decision === "approve") {
                application.status =
                    applications_1.ApplicationStatus.AWAITING_LEARNING_AGREEMENT_APPROVAL;
            }
            else {
                application.status = applications_1.ApplicationStatus.CANCELED;
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
            return;
        }
        // Professor can approve or reject modified courses and mapping
        if (["approve_changes", "reject_changes"].includes(decision)) {
            if (!application.proposedHomeCourses?.length ||
                !application.proposedHostCourses?.length) {
                response.status(400).json({
                    message: "There are no pending course changes to review",
                });
                return;
            }
            // If approved, stores the new courses and mapping
            if (decision === "approve_changes") {
                application.homeCourses = application.proposedHomeCourses;
                application.hostCourses = application.proposedHostCourses;
                application.courseChangeStatus = applications_1.CourseChangeStatus.APPROVED;
                application.courseChangeComment =
                    comment || "Student course change approved";
            }
            else if (decision === "reject_changes") {
                application.courseChangeStatus = applications_1.CourseChangeStatus.REJECTED;
                application.courseChangeComment =
                    comment || "Student course change rejected; original mapping kept";
            }
            application.courseChangeDecisionDate = new Date();
            application.originalHomeCourses = undefined;
            application.originalHostCourses = undefined;
            application.proposedHomeCourses = undefined;
            application.proposedHostCourses = undefined;
            /* if (comment) {
              application.professorComment = comment;
            } */
            await application.save();
            response.json({
                message: decision === "approve_changes"
                    ? "Coourse changes approved successfully"
                    : "Course changes rejected; original mapping remains valid",
                application,
            });
            return;
        }
    }
    catch (error) {
        response.status(400).json({
            message: "Failed to update application decision",
            error,
        });
    }
});
exports.default = router;
