// Upload PDFs and application creation
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
import { Courses, CourseType } from "../../mongodbModels/exams";
import { Users } from "../../mongodbModels/users";

const router = Router();

// Retrieves the student ID associated with a user ID
async function getStudentId(userId: string) {
  const user = await Users.findById(userId).select("student");

  return user?.student?.toString();
}

// Retrieves the professor ID associated with a user ID
async function getProfessorId(userId: string) {
  const user = await Users.findById(userId).select("professor");

  return user?.professor?.toString();
}
// Application validation function
function hasDuplicateCourseIds(courseIds: string[]): boolean {
  return new Set(courseIds).size !== courseIds.length;
}

// Validates the mobility period (start and end dates)
function isValidMobilityPeriod(
  startDateValue: string,
  endDateValue: string,
): boolean {
  const startDate = new Date(startDateValue);
  const endDate = new Date(endDateValue);

  return (
    !Number.isNaN(startDate.getTime()) &&
    !Number.isNaN(endDate.getTime()) &&
    startDate < endDate
  );
}

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

      const homeCourses = JSON.parse(request.body.homeCourses);
      const hostCourses = JSON.parse(request.body.hostCourses);

      if (
        !Array.isArray(homeCourses) ||
        !Array.isArray(hostCourses) ||
        homeCourses.length !== 3 ||
        hostCourses.length !== 3
      ) {
        return response.status(400).json({
          message:
            "Exactly three home courses and three host courses are required",
        });
      }

      if (
        hasDuplicateCourseIds(homeCourses) ||
        hasDuplicateCourseIds(hostCourses)
      ) {
        return response.status(400).json({
          message: "The same course cannot be selected more than once",
        });
      }

      // Associates courses to the respective university
      const validHostCourses = await Courses.countDocuments({
        _id: { $in: hostCourses },
        type: CourseType.HOST,
        hostUniversity: request.body.hostUniversity,
      });

      if (validHostCourses !== hostCourses.length) {
        return response.status(400).json({
          message:
            "The selected host courses do not belong to the chosen host university",
        });
      }

      // Retrieves the student ID associated with the authenticated user
      const studentId = await getStudentId(request.user!.userId);

      if (!studentId) {
        return response.status(403).json({
          message:
            "The authenticated user is not associated with a student profile",
        });
      }

      // Creates the application with the data received
      const application = await Applications.create({
        student: studentId,
        academicYear: request.body.academicYear,
        hostUniversity: request.body.hostUniversity,
        duration: request.body.duration,
        referentProfessor: request.body.referentProfessor,
        homeCourses,
        hostCourses,
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
      const studentId = await getStudentId(request.user!.userId);

      if (!studentId) {
        return response.status(403).json({
          message:
            "The authenticated user is not associated with a student profile",
        });
      }

      const application = await Applications.find({
        student: studentId,
      })
        .populate("hostUniversity referentProfessor homeCourses hostCourses")
        .sort({ createdAt: -1 });

      response.json(application);
    } catch (error) {
      response
        .status(500)
        .json({ message: "Failed to fetch application", error });
    }
  },
);

// POST /api/applications/:id/exams
// Students can update exams scores
router.post(
  "/:id/exams",
  authenticate,
  authorize(UserRole.STUDENT),
  async (request: AuthenticatedRequest, response) => {
    try {
      // Checks if student's application exist
      const application = await Applications.findById(request.params.id);

      if (!application) {
        return response.status(404).json({ message: "Application not found" });
      }

      const studentId = await getStudentId(request.user!.userId);
      if (!studentId) {
        return response.status(403).json({
          message:
            "The authenticated user is not associated with a student profile",
        });
      }

      if (application.student.toString() !== studentId) {
        return response.status(403).json({
          message: "Forbidden",
        });
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

// POST /api/applications/:id/transcript
// Students can upload the Transcrip of Records in PDF
router.post(
  "/:id/transcript",
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
      const application = await Applications.findById(request.params.id);

      if (!application) {
        return response.status(404).json({ message: "Application not found" });
      }

      const studentId = await getStudentId(request.user!.userId);

      if (!studentId) {
        return response.status(403).json({
          message:
            "The authenticated account is not linked to a student profile",
        });
      }

      if (application.student.toString() !== studentId) {
        return response.status(403).json({
          message: "Forbidden",
        });
      }

      // Checks that the mobility has been completed before allowing the transcript upload
      if (application.status !== ApplicationStatus.MOBILITY_COMPLETED) {
        return response.status(400).json({
          message:
            "Transcript of Records can only be uploaded after mobility completion",
        });
      }

      // Saves the uploaded file path and resets the review date
      application.transcriptDocumentPath = request.file.path;
      application.transcriptUploadedAt = new Date();
      application.transcriptApproved = false;
      application.transcriptReviewDate = undefined;
      application.transcriptComment = undefined;

      application.status = ApplicationStatus.WAITING_FOR_EXAM_SCORE_APPROVAL;
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

// PATCH /api/applications/:id/complete-mobility
// Marks the mobility as complete for the authenticated student's application
router.patch(
  "/:id/complete-mobility",
  authenticate,
  authorize(UserRole.STUDENT),
  async (request: AuthenticatedRequest, response) => {
    try {
      const application = await Applications.findById(request.params.id);

      if (!application) {
        return response.status(404).json({
          message: "Application not found",
        });
      }

      const studentId = await getStudentId(request.user!.userId);

      if (!studentId) {
        return response.status(403).json({
          message:
            "The authenticated account is not linked to a student profile",
        });
      }

      if (application.student.toString() !== studentId) {
        return response.status(403).json({
          message: "Forbidden",
        });
      }

      // Check if the mobility is in progress before allowing it to be completed
      if (application.status !== ApplicationStatus.MOBILITY_IN_PROGRESS) {
        return response.status(400).json({
          message: "Only a mobility in progress can be completed",
        });
      }

      if (!application.endDate || application.endDate > new Date()) {
        return response.status(400).json({
          message: "The mobility end date has not been reached yet",
        });
      }

      application.status = ApplicationStatus.MOBILITY_COMPLETED;

      await application.save();

      response.json({
        message: "Mobility marked as completed",
        application,
      });
    } catch (error) {
      response.status(400).json({
        message: "Failed to complete mobility",
        error,
      });
    }
  },
);

// PATCH /api/applications/:id
// Student can modify its own application
router.patch(
  "/:id",
  authenticate,
  authorize(UserRole.STUDENT),
  upload.single("document"),
  async (request: AuthenticatedRequest, response) => {
    try {
      const application = await Applications.findById(request.params.id);

      if (!application) {
        return response.status(404).json({ message: "Application not found" });
      }

      const studentId = await getStudentId(request.user!.userId);

      if (!studentId) {
        return response.status(403).json({
          message:
            "The authenticated account is not linked to a student profile",
        });
      }

      if (application.student.toString() !== studentId) {
        return response.status(403).json({
          message: "Forbidden",
        });
      }

      /* Checks if the application is still on "submitted"
      if (application.status !== ApplicationStatus.SUBMITTED) {
        response.status(400).json({
          message: "Can only modify application in submitted status",
        });
        return;
      } */

      // Allow students to change dates and courses
      const canEditApplication = [
        ApplicationStatus.CREATED,
        ApplicationStatus.SUBMITTED,
        ApplicationStatus.PROFESSOR_APPROVED,
        ApplicationStatus.OFFICE_VERIFIED,
        ApplicationStatus.MOBILITY_IN_PROGRESS,
      ].includes(application.status);

      if (!canEditApplication) {
        return response.status(400).json({
          message:
            "Can only modify the application while it's created, submitted or approved",
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

      const newHomeCourses = request.body.homeCourses
        ? JSON.parse(request.body.homeCourses)
        : undefined;

      const newHostCourses = request.body.hostCourses
        ? JSON.parse(request.body.hostCourses)
        : undefined;

      if (
        (newHomeCourses &&
          (!Array.isArray(newHomeCourses) ||
            newHomeCourses.length !== 3 ||
            hasDuplicateCourseIds(newHomeCourses))) ||
        (newHostCourses &&
          (!Array.isArray(newHostCourses) ||
            newHostCourses.length !== 3 ||
            hasDuplicateCourseIds(newHostCourses)))
      ) {
        return response.status(400).json({
          message: "Each course list must contain exactly 3 unique courses",
        });
      }

      if (newHostCourses) {
        const validHostCourses = await Courses.countDocuments({
          _id: { $in: newHostCourses },
          type: CourseType.HOST,
          hostUniversity: application.hostUniversity,
        });

        if (validHostCourses !== newHostCourses.length) {
          return response.status(400).json({
            message:
              "The selected host courses do not belong to this application's host university",
          });
        }
      }

      if (isCourseChangeRequest && !request.file) {
        return response.status(400).json({
          message:
            "A new Learning Agreement PDF is required when modifying host courses or mapping",
        });
      }

      if (request.file && isCourseChangeRequest) {
        application.proposedDocumentPath = request.file.path;
        application.courseChangeStatus = CourseChangeStatus.PENDING;
      }

      // New mobility dates with validation
      const newStartDate = request.body.startDate;
      const newEndDate = request.body.endDate;

      if (newStartDate || newEndDate) {
        const startDateValue =
          newStartDate || application.startDate?.toISOString().slice(0, 10);

        const endDateValue =
          newEndDate || application.endDate?.toISOString().slice(0, 10);

        if (
          !startDateValue ||
          !endDateValue ||
          !isValidMobilityPeriod(startDateValue, endDateValue)
        ) {
          return response.status(400).json({
            message: "Start date must be before end date",
          });
        }

        application.startDate = new Date(startDateValue);
        application.endDate = new Date(endDateValue);
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

        if (
          application.status === ApplicationStatus.CREATED ||
          application.status === ApplicationStatus.SUBMITTED
        ) {
          application.homeCourses = newHomeCourses;
        } else {
          application.proposedHomeCourses = newHomeCourses;
          application.courseChangeStatus = CourseChangeStatus.PENDING;
        }
      }

      if (request.body.hostCourses) {
        //application.hostCourses = JSON.parse(request.body.hostCourses);
        if (
          application.status === ApplicationStatus.CREATED ||
          application.status === ApplicationStatus.SUBMITTED
        ) {
          application.hostCourses = newHostCourses;
        } else {
          application.proposedHostCourses = newHostCourses;
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
      const studentId = await getStudentId(request.user!.userId);

      if (!studentId) {
        return response.status(403).json({
          message:
            "The authenticated account is not linked to a student profile",
        });
      }

      if (application.student.toString() !== studentId) {
        return response.status(403).json({ message: "Forbidden" });
      }

      // Check permissions based on user role
      const isStudent = request.user!.role === UserRole.STUDENT;
      const isProfessor = request.user!.role === UserRole.PROFESSOR;
      const isStaff = request.user!.role === UserRole.OFFICE_STAFF;

      // Professor can see only applications where he is the referent
      const isReferent =
        application.referentProfessor._id.toString() === request.user!.userId;

      // Student can see only his own applications
      if (!studentId) {
        return response.status(403).json({
          message:
            "The authenticated account is not linked to a student profile",
        });
      }

      const isOwner = application.student._id.toString() === studentId;

      if (isProfessor && !isReferent) {
        response.status(403).json({ message: "Forbidden" });
        return;
      }

      if (isStudent && !isOwner) {
        return response.status(403).json({
          message: "Forbidden",
        });
      }

      if (!isStudent && !isProfessor && !isStaff) {
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

// GET /api/applications/:id/transcript/document
// Student owner, referent professor, and office staff can download the transcript
router.get(
  "/:id/transcript/document",
  authenticate,
  async (request: AuthenticatedRequest, response) => {
    try {
      const application = await Applications.findById(request.params.id);

      if (!application || !application.transcriptDocumentPath) {
        return response.status(404).json({
          message: "Transcript of Records not found",
        });
      }

      // Check if the user is office staff
      const isOfficeStaff = request.user!.role === UserRole.OFFICE_STAFF;

      if (isOfficeStaff) {
        return response.download(application.transcriptDocumentPath);
      }

      // Get the student and professor IDs for the current user
      const studentId = await getStudentId(request.user!.userId);
      const professorId = await getProfessorId(request.user!.userId);

      // Check if the current user is the owner (student) or the referent professor
      const isOwner =
        request.user!.role === UserRole.STUDENT &&
        studentId === application.student.toString();

      const isReferent =
        request.user!.role === UserRole.PROFESSOR &&
        professorId === application.referentProfessor.toString();

      if (!isOwner && !isReferent) {
        return response.status(403).json({ message: "Forbidden" });
      }

      response.download(application.transcriptDocumentPath);
    } catch (error) {
      response.status(500).json({
        message: "Failed to download Transcript of Records",
        error,
      });
    }
  },
);

export default router;
