// Routes for office staff
import { Router } from "express";
import {
  Applications,
  ApplicationStatus,
  canBeMarkedCompleted,
} from "../../mongodbModels/applications";
import {
  AuthenticatedRequest,
  authenticate,
  authorize,
} from "../middleware/auth";
import { UserRole } from "../../mongodbModels/userRole";
import { app } from "../app";

const router = Router();

// GET /api/office/applications
// Office staff can see all applications
router.get(
  "/applications",
  authenticate,
  authorize(UserRole.OFFICE_STAFF),
  async (request: AuthenticatedRequest, response) => {
    try {
      // Get all applications with optional filtering by status
      const { status } = request.query;

      let query: any = {};
      if (status) {
        query.status = status;
      }

      const applications = await Applications.find(query).populate(
        "student hostUniversity referentProfessor homeCourses hostCourses",
      );

      response.json(applications);
    } catch (error) {
      response
        .status(500)
        .json({ message: "Failed to fetch applications", error });
    }
  },
);

// PATCH /api/office/applications/:id/verify
// Office staff verifies an application that was already approved by the professor
router.patch(
  "/applications/:id/verify",
  authenticate,
  authorize(UserRole.OFFICE_STAFF),
  async (request: AuthenticatedRequest, response) => {
    try {
      const { comment } = request.body;

      const application = await Applications.findById(request.params.id);

      if (!application) {
        response.status(404).json({ message: "Application not found" });
        return;
      }

      // The application must already be in the final review phase before office closure
      if (
        application.status !== ApplicationStatus.WAITING_FOR_EXAM_SCORE_APPROVAL &&
        application.status !== ApplicationStatus.MOBILITY_IN_PROGRESS
      ) {
        response.status(400).json({
          message:
            "Can only verify applications after the mobility and exam review phase",
        });
        return;
      }

      // Final checks before closing the application
      const hasLearningAgreementApproved =
        application.learningAgreementApproved === true;

      const hasTranscriptApproved = application.transcriptApproved === true;

      const hasApprovedExams =
        Array.isArray(application.passedHostCourses) &&
        application.passedHostCourses.length > 0 &&
        application.passedHostCourses.every(
          (exam) => exam.status === "approved",
        );

      const isComplete =
        /*canBeMarkedCompleted({
        academicYear: application.academicYear,
        hostUniversity: application.hostUniversity,
        duration: application.duration,
        referentProfessor: application.referentProfessor,
        homeCourses: application.homeCourses,
        hostCourses: application.hostCourses,
        documentPath: application.documentPath,
        learningAgreementApproved: true,
      }); */
        hasLearningAgreementApproved &&
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
          message:
            "Application cannot be marked as completed: missing required fields, learning agreement not approved, transcript not approved, or exams not accepted",
        });
        return;
      }

      // Update the application status and add office comment and verification date
      application.status = ApplicationStatus.CLOSED;
      application.officeComment =
        comment || "Application verified and closed by office staff";
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
    } catch (error) {
      response.status(400).json({
        message: "Failed to verify application",
        error,
      });
    }
  },
);

export default router;
