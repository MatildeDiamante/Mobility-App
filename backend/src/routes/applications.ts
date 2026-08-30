// Upload PDF and application creation
import { Router } from "express";
import multer from "multer";
import { Applications } from "../../mongodbModels/applications";
import {
  AuthenticatedRequest,
  authenticate,
  authorize,
} from "../middleware/auth";
import { UserRole } from "../../mongodbModels/userRole";

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

// PATCH /api/applications/me
// Student can modify its own application
router.patch(
  "/me",
  authenticate,
  authorize(UserRole.STUDENT),
  async (request: AuthenticatedRequest, response) => {
    try {
      const application = await Applications.findOne({
        student: request.user!.userId,
      });

      if (!application) {
        response.status(404).json({ message: "Application not found" });
        return;
      }

      // Checks if the application is still on "submitted"
      if (application.status !== "submitted") {
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
    } catch (error) {
      response
        .status(400)
        .json({ message: "Failed to upload application, error" });
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
