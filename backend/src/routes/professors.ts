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
import { Users } from "../../mongodbModels/users";

const router = Router();

// Helper function to get the professor profile ID associated with a user
async function getProfessorProfileId(
  userId: string,
): Promise<string | undefined> {
  const user = await Users.findById(userId).select("professor");

  return user?.professor?.toString();
}

// GET /api/professor/applications
// Professor can see only applications where he/she is the referent professor
router.get(
  "/applications",
  authenticate,
  authorize(UserRole.PROFESSOR),
  async (request: AuthenticatedRequest, response) => {
    try {
      // Get all applications where this professor is the referent
      const professorProfileId = await getProfessorProfileId(
        request.user!.userId,
      );

      if (!professorProfileId) {
        return response.status(403).json({
          message:
            "The authenticated account is not linked to a professor profile",
        });
      }
      const applications = await Applications.find({
        referentProfessor: professorProfileId,
      }).populate(
        "student hostUniversity homeCourses hostCourses proposedHomeCourses proposedHostCourses passedHostCourses.course",
      );

      response.json(applications);
    } catch (error) {
      response
        .status(500)
        .json({ message: "Failed to fetch applications", error });
    }
  },
);

// PATCH /api/professor/applications/:id/transcript/review
// the referent professor reviews the transcript of records
// uploaded by the student
router.patch(
  "/applications/:id/transcript/review",
  authenticate,
  authorize(UserRole.PROFESSOR),
  async (request: AuthenticatedRequest, response) => {
    try {
      const { approved, comment } = request.body;

      // Checks that application exists
      const application = await Applications.findById(request.params.id);

      if (!application) {
        return response.status(404).json({ message: "Application not found" });
      }

      const professorProfileId = await getProfessorProfileId(
        request.user!.userId,
      );

      // Check if the authenticated user has a linked professor profile
      if (!professorProfileId) {
        return response.status(403).json({
          message:
            "The authenticated account is not linked to a professor profile",
        });
      }

      // Verifyes that the professor is the referent
      if (application.referentProfessor.toString() !== professorProfileId) {
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
      application.transcriptComment = comment?.trim() || "";

      // If approved, stores the passed courses
      if (approved) {
        application.status = ApplicationStatus.WAITING_FOR_EXAM_SCORE_APPROVAL;
      } else {
        if (!comment?.trim()) {
          return response.status(400).json({
            message: "Comment is required when rejecting the transcript",
          });
        }

        application.status = ApplicationStatus.MOBILITY_COMPLETED;
      }

      await application.save();

      // updated application with the final review decision
      response.json({
        message: approved
          ? "Transcript approved successfully"
          : "Transcript rejected",
        application,
      });
    } catch (error) {
      response
        .status(400)
        .json({ message: "Failed to review Transcript of Records", error });
    }
  },
);

// PATCH /api/professor/applications/:id/exams/review
// Professor reviews exams taken and scores
router.patch(
  "/applications/:id/exams/review",
  authenticate,
  authorize(UserRole.PROFESSOR),
  async (request: AuthenticatedRequest, response) => {
    try {
      const { reviews } = request.body;

      // Checks if application exists
      const application = await Applications.findById(request.params.id);

      if (!application) {
        return response.status(404).json({ message: "Application not found" });
      }

      const professorProfileId = await getProfessorProfileId(
        request.user!.userId,
      );

      // Checks if the authenticated user has a linked professor profile
      if (!professorProfileId) {
        return response.status(403).json({
          message:
            "The authenticated account is not linked to a professor profile",
        });
      }

      // Checks whether professor is a referent
      if (application.referentProfessor.toString() !== professorProfileId) {
        return response.status(403).json({ message: "Forbidden" });
      }

      if (
        !application.passedHostCourses ||
        application.passedHostCourses.length === 0
      ) {
        return response
          .status(400)
          .json({ message: "No passed exams to review" });
      }

      // Professor can approve or reject taken exams and scores
      if (!Array.isArray(reviews)) {
        return response
          .status(400)
          .json({ message: "Reviews must be an array" });
      }

      const submittedCourseIds = new Set(
        application.passedHostCourses.map((exam) => exam.course.toString()),
      );

      const reviewsAreValid = reviews.every(
        (review) =>
          typeof review.courseId === "string" &&
          typeof review.approved === "boolean" &&
          submittedCourseIds.has(review.courseId),
      );

      if (!reviewsAreValid || reviews.length !== submittedCourseIds.size) {
        return response.status(400).json({
          message: "A review is required for each submitted host exam",
        });
      }

      const rejectedReviewWithoutReason = reviews.some(
        (review) => !review.approved && !review.comment?.trim(),
      );

      if (rejectedReviewWithoutReason) {
        return response
          .status(400)
          .json({ message: "Rejected reviews must include a reason" });
      }

      application.passedHostCourses = application.passedHostCourses.map(
        (exam) => {
          const review = reviews.find(
            (item) => item.courseId === exam.course.toString(),
          )!;

          return {
            ...exam,
            status: review.approved ? "approved" : "rejected",
            comment: review.comment?.trim() || "",
          };
        },
      );

      application.status = ApplicationStatus.WAITING_FOR_EXAM_SCORE_APPROVAL;

      await application.save();

      response.json({
        message: "Passed exams reviewed successfully",
        application,
      });
    } catch (error) {
      response
        .status(400)
        .json({ message: "Failed to review passed exams", error });
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

      if (["reject", "reject_changes"].includes(decision) && !comment?.trim()) {
        return response.status(400).json({
          message:
            "A reason is required when rejecting an application of course changes",
        });
      }

      const application = await Applications.findById(request.params.id);

      if (!application) {
        response.status(404).json({ message: "Application not found" });
        return;
      }

      const professorProfileId = await getProfessorProfileId(
        request.user!.userId,
      );

      // Check if the authenticated user has a linked professor profile
      if (!professorProfileId) {
        return response.status(403).json({
          message:
            "The authenticated account is not linked to a professor profile",
        });
      }

      // Check if the professor is the referent of this application
      if (application.referentProfessor.toString() !== professorProfileId) {
        return response.status(403).json({ message: "Forbidden" });
      }

      // Check if the application is still in the initial created status
      if (["approve", "reject"].includes(decision)) {
        if (application.status !== ApplicationStatus.CREATED) {
          response.status(400).json({
            message: "Can only decide on applications in created status",
          });
          return;
        }

        // Update the application status and add professor's comment and decision date
        if (decision === "approve") {
          application.status =
            ApplicationStatus.AWAITING_LEARNING_AGREEMENT_APPROVAL;
          application.learningAgreementApproved = true;
        } else {
          application.status = ApplicationStatus.CANCELED;
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
          !application.proposedHostCourses?.length ||
          !application.proposedDocumentPath
        ) {
          return response.status(400).json({
            message: "There are no pending course changes to review",
          });
        }

        // If approved, stores the new courses and mapping
        if (decision === "approve_changes") {
          application.homeCourses = application.proposedHomeCourses;
          application.hostCourses = application.proposedHostCourses;
          application.documentPath = application.proposedDocumentPath;
          application.status = ApplicationStatus.PROFESSOR_APPROVED;
          application.learningAgreementApproved = true;
          application.courseChangeStatus = CourseChangeStatus.APPROVED;
          application.courseChangeComment =
            comment || "Student course change approved";
        }

        if (decision === "reject_changes") {
          if (!comment?.trim()) {
            return response.status(400).json({
              message: "A comment is required when rejecting course changes",
            });
          }

          application.courseChangeStatus = CourseChangeStatus.REJECTED;
          application.courseChangeComment = comment.trim();
        }

        application.courseChangeDecisionDate = new Date();

        application.proposedHomeCourses = undefined;
        application.proposedHostCourses = undefined;
        application.proposedDocumentPath = undefined;

        /* if (comment) {
          application.professorComment = comment;
        } */

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

// GET /api/professors/applications/:id/learning-agreement
// Retrieves the learning agreement for a specific application
router.get(
  "/applications/:id/learning-agreement",
  authenticate,
  authorize(UserRole.PROFESSOR),
  async (request: AuthenticatedRequest, response) => {
    const professorId = await getProfessorProfileId(request.user!.userId);
    const application = await Applications.findById(request.params.id);

    if (
      !professorId ||
      !application ||
      application.referentProfessor.toString() !== professorId
    ) {
      return response.status(403).json({ message: "Forbidden" });
    }

    response.download(application.documentPath);
  },
);

// GET /api/professors/applications/:id/transcript
// Retrieves the transcript for a specific application
router.get(
  "/applications/:id/transcript",
  authenticate,
  authorize(UserRole.PROFESSOR),
  async (request: AuthenticatedRequest, response) => {
    const professorId = await getProfessorProfileId(request.user!.userId);
    const application = await Applications.findById(request.params.id);

    if (
      !professorId ||
      !application ||
      !application.transcriptDocumentPath ||
      application.referentProfessor.toString() !== professorId
    ) {
      return response.status(403).json({ message: "Forbidden" });
    }

    response.download(application.transcriptDocumentPath);
  },
);

// GET /api/professors/applications/:id/proposed-learning-agreement
// Retrieves the proposed learning agreement for a specific application
router.get(
  "/applications/:id/proposed-learning-agreement",
  authenticate,
  authorize(UserRole.PROFESSOR),
  async (request: AuthenticatedRequest, response) => {
    const professorId = await getProfessorProfileId(request.user!.userId);
    const application = await Applications.findById(request.params.id);

    if (
      !professorId ||
      !application ||
      !application.proposedDocumentPath ||
      application.referentProfessor.toString() !== professorId
    ) {
      return response.status(403).json({ message: "Forbidden" });
    }

    response.download(application.proposedDocumentPath);
  },
);

export default router;
