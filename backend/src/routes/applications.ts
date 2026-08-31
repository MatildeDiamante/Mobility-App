// Upload PDF and application creation
import { Router } from "express";
import multer from "multer";
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
import { app } from "../app";

const router = Router();

// Configuration of multer for the PDF upload
const upload = multer({
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
router.post(
  "/",
  authenticate,
  authorize(UserRole.STUDENT),
  upload.single("document"),
  async (request: AuthenticatedRequest, response) => {
    try {
      if (!request.file) {
        response
          .status(400)
          .json({ message: "Learning Agreement is required" });
        return;
      }

      // Creates the application with the data received
      const application = await Applications.create({
        student: request.user!.userId,
        academicYear: request.body.academicYear,
        hostUniversity: request.body.hostUniversity,
        duration: request.body.duration,
        referentProfessor: request.body.referentProfessor,
        homeCourses: JSON.parse(request.body.homeCourses),
        hostCourses: JSON.parse(request.body.hostCourses),
        documentPath: request.file.path,
        status: ApplicationStatus.CREATED,
      });

      response.status(201).json(application);
    } catch (error) {
      response
        .status(400)
        .json({ message: "Failed to create application", error });
    }
  },
);

// GET /api/applications/me
// Student can read its own application
router.get(
  "/me",
  authenticate,
  authorize(UserRole.STUDENT),
  async (request: AuthenticatedRequest, response) => {
    try {
      const application = await Applications.findOne({
        student: request.user!.userId,
      }).populate("hostUniversity referentProfessor homeCourses hostCourses");

      if (!application) {
        response.status(404).json({ message: "Application not found" });
        return;
      }

      response.json(application);
    } catch (error) {
      response
        .status(500)
        .json({ message: "Failed to fetch application", error });
    }
  },
);

// POST /api/applications/me/exams
// Students can update exams scores
router.post(
  "/me/exams",
  authenticate,
  authorize(UserRole.STUDENT),
  async (request: AuthenticatedRequest, response) => {
    try {
      // Checks if student's application exist
      const application = await Applications.findOne({
        student: request.user!.userId,
      });

      if (!application) {
        return response.status(404).json({ message: "Application not found" });
      }

      const { passedHostCourses } = request.body;

      // Verifies that the taken exams are in an array format
      if (!Array.isArray(passedHostCourses)) {
        return response
          .status(400)
          .json({ message: "passedHostCourses must be an array" });
      }

      // Transform each exam in an object
      application.passedHostCourses = passedHostCourses.map((exam: any) => ({
        course: exam.course,
        grade: exam.grade,
        examDate: new Date(exam.examDate),
        status: "pending",
      }));

      await application.save();

      response.json({
        message: "Passed exams submitted for review",
        application,
      });
    } catch (error) {
      response
        .status(400)
        .json({ message: "Failed to save passed esams", error });
    }
  },
);

// POST /api/applications/me/transcript
// Students can upload the Transcrip of Records in PDF
router.post(
  "/me/transcript",
  authenticate,
  authorize(UserRole.STUDENT),
  upload.single("transcript"),
  async (request: AuthenticatedRequest, response) => {
    try {
      // Checks that a PDF file was uploaded
      if (!request.file) {
        return response
          .status(400)
          .json({ message: "Transcript of Records PDF is required" });
      }

      // Finds students' application
      const application = await Applications.findOne({
        student: request.user!.userId,
      });

      if (!application) {
        return response.status(404).json({ message: "Application not found" });
      }

      // Saves the uploaded file path and resets the review date
      application.transcriptDocumentPath = request.file.path;
      application.transcriptUploadedAt = new Date();
      application.transcriptApproved = false;
      application.transcriptReviewDate = undefined;
      application.transcriptComment = undefined;

      await application.save();

      response.status(201).json({
        message: "Transcript of Records uploaded successfully",
        application,
      });
    } catch (error) {
      response
        .status(400)
        .json({ message: "Failed to upload Transcript of Records", error });
    }
  },
);

// PATCH /api/applications/me
// Student can modify its own application
router.patch(
  "/me",
  authenticate,
  authorize(UserRole.STUDENT),
  upload.single("document"),
  async (request: AuthenticatedRequest, response) => {
    try {
      const application = await Applications.findOne({
        student: request.user!.userId,
      });

      if (!application) {
        return response.status(404).json({ message: "Application not found" });
      }

      /* Checks if the application is still on "submitted"
      if (application.status !== ApplicationStatus.SUBMITTED) {
        response.status(400).json({
          message: "Can only modify application in submitted status",
        });
        return;
      } */

      // Allow students to change dates and courses
      const isInitialSubmission =
        application.status === ApplicationStatus.SUBMITTED;
      const canProposeChanges = [
        ApplicationStatus.PROFESSOR_APPROVED,
        ApplicationStatus.OFFICE_VERIFIED,
      ].includes(application.status);

      if (!isInitialSubmission && !canProposeChanges) {
        return response.status(400).json({
          message:
            "Can only modify the application while it's in submitted or after approval",
        });
      }

      // Students can change year, host university or referent professor
      application.academicYear =
        request.body.academicYear || application.academicYear;
      application.hostUniversity =
        request.body.hostUniversity || application.hostUniversity;
      application.duration = request.body.duration || application.duration;
      application.referentProfessor =
        request.body.referentProfessor || application.referentProfessor;

      //If students modifies host courses and mapping after the first approvation
      const isCourseChangeRequest =
        request.body.homeCourses || request.body.hostCourses;

      if (isCourseChangeRequest && !request.file) {
        return response.status(400).json({
          message:
            "A new Learning Agreement PDF is required when modifying host courses or mapping",
        });
      }

      if (request.file && isCourseChangeRequest) {
        application.documentPath = request.file.path;
        application.learningAgreementApproved = false;
      }

      // New mobility dates
      if (request.body.startDate) {
        application.startDate = new Date(request.body.startDate);
      }
      if (request.body.endDate) {
        application.endDate = new Date(request.body.endDate);
      }

      if (
        application.startDate &&
        new Date() >= new Date(application.startDate) &&
        application.status !== ApplicationStatus.CLOSED &&
        application.status !== ApplicationStatus.CANCELED
      ) {
        application.status = ApplicationStatus.MOBILITY_IN_PROGRESS;
      }

      // Possibility to modify courses
      if (request.body.homeCourses) {
        //application.homeCourses = JSON.parse(request.body.homeCourses);

        if (application.status === ApplicationStatus.SUBMITTED) {
          application.homeCourses = JSON.parse(request.body.homeCourses);
        } else {
          application.proposedHomeCourses = JSON.parse(
            request.body.homeCourses,
          );
          application.courseChangeStatus = CourseChangeStatus.PENDING;
        }
      }

      if (request.body.hostCourses) {
        //application.hostCourses = JSON.parse(request.body.hostCourses);
        if (application.status === ApplicationStatus.SUBMITTED) {
          application.hostCourses = JSON.parse(request.body.hostCourses);
        } else {
          application.proposedHostCourses = JSON.parse(
            request.body.hostCourses,
          );
          application.courseChangeStatus = CourseChangeStatus.PENDING;
        }
      }

      await application.save();
      response.json(application);
    } catch (error) {
      response
        .status(400)
        .json({ message: "Failed to upload application, error" });
    }
  },
);

// GET /api/applications/:id
// Professor can see applications where he is the referent
// Staff can see any application
router.get(
  "/:id",
  authenticate,
  async (request: AuthenticatedRequest, response) => {
    try {
      const application = await Applications.findById(
        request.params.id,
      ).populate(
        "student hostUniversity referentProfessor homeCourses hostCourses",
      );

      if (!application) {
        response.status(404).json({ message: "Application not found" });
        return;
      }

      // Check permissions based on user role
      const isProfessor = request.user!.role === UserRole.PROFESSOR;
      const isStaff = request.user!.role === UserRole.OFFICE_STAFF;

      // Professor can see only applications where he is the referent
      const isReferent =
        application.referentProfessor._id.toString() === request.user!.userId;

      if (isProfessor && !isReferent) {
        response.status(403).json({ message: "Forbidden" });
        return;
      }

      if (!isProfessor && !isStaff) {
        response.status(403).json({ message: "Forbidden" });
        return;
      }

      response.json(application);
    } catch (error) {
      response
        .status(500)
        .json({ message: "Failed to fetch application", error });
    }
  },
);

// GET /api/applications/:id/document
// PDF download - permissions: student (owner), professor (referent), staff (all)
router.get(
  "/:id/document",
  authenticate,
  async (request: AuthenticatedRequest, response) => {
    try {
      const application = await Applications.findById(request.params.id);

      if (!application) {
        response.status(404).json({ message: "Application not found" });
        return;
      }

      // Check permissions based on user role
      const isStudent = request.user!.role === UserRole.STUDENT;
      const isProfessor = request.user!.role === UserRole.PROFESSOR;
      const isStaff = request.user!.role === UserRole.OFFICE_STAFF;

      // Student can download only his own application
      const isOwner = application.student.toString() === request.user!.userId;

      // Professor can download applications where he is the referent
      const isReferent =
        application.referentProfessor.toString() === request.user!.userId;

      // Check if user has permission
      const hasPermission =
        (isStudent && isOwner) || (isProfessor && isReferent) || isStaff;

      if (!hasPermission) {
        response.status(403).json({ message: "Forbidden" });
        return;
      }

      response.download(application.documentPath);
    } catch (error) {
      response
        .status(500)
        .json({ message: "Failed to download document", error });
    }
  },
);

export default router;
