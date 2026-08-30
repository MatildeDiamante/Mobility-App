// Routes for office staff
import { Router } from "express";
import {
  Applications,
  ApplicationStatus,
} from "../../mongodbModels/applications";
import {
  AuthenticatedRequest,
  authenticate,
  authorize,
} from "../middleware/auth";
import { UserRole } from "../../mongodbModels/userRole";

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

      // Check if the application is in "professor_approved" status
      if (application.status !== ApplicationStatus.PROFESSOR_APPROVED) {
        response.status(400).json({
          message: "Can only verify applications approved by the professor",
        });
        return;
      }

      // Update the application status and add office comment
      application.status = ApplicationStatus.OFFICE_VERIFIED;

      if (comment) {
        application.officeComment = comment;
      }

      await application.save();

      response.json({
        message: "Application verified successfully",
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
