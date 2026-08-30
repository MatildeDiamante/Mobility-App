// Routes for professors
import { Router } from "express";
import {
  Applications,
  ApplicationStatus,
  CourseChangeStatus,
} from "../../mongodbModels/applications";
import {
  AuthenticatedRequest,
  authenticate,
  authorize,
} from "../middleware/auth";
import { UserRole } from "../../mongodbModels/userRole";

const router = Router();

// GET /api/professor/applications
// Professor can see only applications where he/she is the referent professor
router.get(
  "/applications",
  authenticate,
  authorize(UserRole.PROFESSOR),
  async (request: AuthenticatedRequest, response) => {
    try {
      // Get all applications where this professor is the referent
      const applications = await Applications.find({
        referentProfessor: request.user!.userId,
      }).populate("student hostUniversity homeCourses hostCourses");

      response.json(applications);
    } catch (error) {
      response
        .status(500)
        .json({ message: "Failed to fetch applications", error });
    }
  },
);

// PATCH /api/professor/applications/:id/decision
// Professor can approve or reject an application
router.patch(
  "/applications/:id/decision",
  authenticate,
  authorize(UserRole.PROFESSOR),
  async (request: AuthenticatedRequest, response) => {
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
          message:
            "Decision must be 'approve' or 'reject', 'approve_changes' or 'reject_changes'",
        });
        return;
      }

      const application = await Applications.findById(request.params.id);

      if (!application) {
        response.status(404).json({ message: "Application not found" });
        return;
      }

      // Check if the professor is the referent of this application
      if (application.referentProfessor.toString() !== request.user!.userId) {
        response.status(403).json({ message: "Forbidden" });
        return;
      }

      // Check if the initial application is still in "submitted" status
      if (["approve", "reject"].includes(decision)) {
        if (application.status !== ApplicationStatus.SUBMITTED) {
          response.status(400).json({
            message: "Can only decide on applications in submitted status",
          });
          return;
        }

        // Update the application status and add professor's comment and decision date
        if (decision === "approve") {
          application.status = ApplicationStatus.PROFESSOR_APPROVED;
        } else {
          application.status = ApplicationStatus.PROFESSOR_REJECTED;
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
        if (
          !application.proposedHomeCourses?.length ||
          !application.proposedHostCourses?.length
        ) {
          response.status(400).json({
            message: "There are no pending course changes to review",
          });
          return;
        }

        if (decision === "approved_changes") {
          application.homeCourses = application.proposedHomeCourses;
          application.hostCourses = application.proposedHostCourses;
        } else if (decision === "reject_changes") {
          application.courseChangeStatus = CourseChangeStatus.REJECTED;
        }

        application.courseChangeDecisionDate = new Date();

        application.originalHomeCourses = undefined;
        application.originalHostCourses = undefined;
        application.proposedHomeCourses = undefined;
        application.proposedHostCourses = undefined;

        if (comment) {
          application.professorComment = comment;
        }

        await application.save();

        response.json({
          message:
            decision === "approve_changes"
              ? "Coourse changes approved successfully"
              : "Course changes rejected; original mapping remains valid",
          application,
        });
        return;
      }
    } catch (error) {
      response.status(400).json({
        message: "Failed to update application decision",
        error,
      });
    }
  },
);

export default router;
