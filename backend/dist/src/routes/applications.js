"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Upload PDFs and application creation
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const multer_1 = __importDefault(require("multer"));
const applications_1 = require("../../mongodbModels/applications");
const auth_1 = require("../middleware/auth");
const userRole_1 = require("../../mongodbModels/userRole");
const exams_1 = require("../../mongodbModels/exams");
const users_1 = require("../../mongodbModels/users");
const router = (0, express_1.Router)();
// Retrieves the student ID associated with a user ID
async function getStudentId(userId) {
    const user = await users_1.Users.findById(userId).select("student");
    return user?.student?.toString();
}
// Retrieves the professor ID associated with a user ID
async function getProfessorId(userId) {
    const user = await users_1.Users.findById(userId).select("professor");
    return user?.professor?.toString();
}
// Application validation function
function hasDuplicateCourseIds(courseIds) {
    return new Set(courseIds).size !== courseIds.length;
}
// Validates the mobility period (start and end dates)
function isValidMobilityPeriod(startDateValue, endDateValue) {
    const startDate = new Date(startDateValue);
    const endDate = new Date(endDateValue);
    return (!Number.isNaN(startDate.getTime()) &&
        !Number.isNaN(endDate.getTime()) &&
        startDate < endDate);
}
// Configuration of multer for the PDF upload
const upload = (0, multer_1.default)({
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
router.post("/", auth_1.authenticate, (0, auth_1.authorize)(userRole_1.UserRole.STUDENT), upload.single("document"), async (request, response) => {
    try {
        if (!request.file) {
            response
                .status(400)
                .json({ message: "Learning Agreement is required" });
            return;
        }
        const homeCourses = JSON.parse(request.body.homeCourses);
        const hostCourses = JSON.parse(request.body.hostCourses);
        if (!Array.isArray(homeCourses) ||
            !Array.isArray(hostCourses) ||
            homeCourses.length !== 3 ||
            hostCourses.length !== 3) {
            return response.status(400).json({
                message: "Exactly three home courses and three host courses are required",
            });
        }
        if (hasDuplicateCourseIds(homeCourses) ||
            hasDuplicateCourseIds(hostCourses)) {
            return response.status(400).json({
                message: "The same course cannot be selected more than once",
            });
        }
        // Associates courses to the respective university
        const validHostCourses = await exams_1.Courses.countDocuments({
            _id: { $in: hostCourses },
            type: exams_1.CourseType.HOST,
            hostUniversity: request.body.hostUniversity,
        });
        if (validHostCourses !== hostCourses.length) {
            return response.status(400).json({
                message: "The selected host courses do not belong to the chosen host university",
            });
        }
        // Retrieves the student ID associated with the authenticated user
        const studentId = await getStudentId(request.user.userId);
        if (!studentId) {
            return response.status(403).json({
                message: "The authenticated user is not associated with a student profile",
            });
        }
        // Creates the application with the data received
        const application = await applications_1.Applications.create({
            student: studentId,
            academicYear: request.body.academicYear,
            hostUniversity: request.body.hostUniversity,
            duration: request.body.duration,
            referentProfessor: request.body.referentProfessor,
            homeCourses,
            hostCourses,
            documentPath: request.file.path,
            status: applications_1.ApplicationStatus.CREATED,
        });
        response.status(201).json(application);
    }
    catch (error) {
        response
            .status(400)
            .json({ message: "Failed to create application", error });
    }
});
// GET /api/applications/me
// Student can read its own application
router.get("/me", auth_1.authenticate, (0, auth_1.authorize)(userRole_1.UserRole.STUDENT), async (request, response) => {
    try {
        const studentId = await getStudentId(request.user.userId);
        if (!studentId) {
            return response.status(403).json({
                message: "The authenticated user is not associated with a student profile",
            });
        }
        const application = await applications_1.Applications.find({
            student: studentId,
        })
            .populate("hostUniversity referentProfessor homeCourses hostCourses")
            .sort({ createdAt: -1 });
        response.json(application);
    }
    catch (error) {
        response
            .status(500)
            .json({ message: "Failed to fetch application", error });
    }
});
// POST /api/applications/:id/exams
// Students can update exams scores
router.post("/:id/exams", auth_1.authenticate, (0, auth_1.authorize)(userRole_1.UserRole.STUDENT), async (request, response) => {
    try {
        // Checks if student's application exist
        const application = await applications_1.Applications.findById(request.params.id);
        if (!application) {
            return response.status(404).json({ message: "Application not found" });
        }
        const studentId = await getStudentId(request.user.userId);
        if (!studentId) {
            return response.status(403).json({
                message: "The authenticated user is not associated with a student profile",
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
        application.passedHostCourses = passedHostCourses.map((exam) => ({
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
    }
    catch (error) {
        response
            .status(400)
            .json({ message: "Failed to save passed esams", error });
    }
});
// POST /api/applications/:id/transcript
// Students can upload the Transcrip of Records in PDF
router.post("/:id/transcript", auth_1.authenticate, (0, auth_1.authorize)(userRole_1.UserRole.STUDENT), upload.single("transcript"), async (request, response) => {
    try {
        // Checks that a PDF file was uploaded
        if (!request.file) {
            return response
                .status(400)
                .json({ message: "Transcript of Records PDF is required" });
        }
        let passedHostCourses;
        try {
            passedHostCourses = JSON.parse(request.body.passedHostCourses);
        }
        catch {
            return response.status(400).json({
                message: "passedHostCourses must be a valid JSON array",
            });
        }
        if (!Array.isArray(passedHostCourses) ||
            passedHostCourses.length === 0 ||
            passedHostCourses.some((exam) => typeof exam.course !== "string" ||
                !exam.grade ||
                !exam.grade.trim())) {
            return response.status(400).json({
                message: "A grade is required for every host course",
            });
        }
        // Finds students' application
        const application = await applications_1.Applications.findById(request.params.id);
        if (!application) {
            return response.status(404).json({ message: "Application not found" });
        }
        const studentId = await getStudentId(request.user.userId);
        if (!studentId) {
            return response.status(403).json({
                message: "The authenticated account is not linked to a student profile",
            });
        }
        if (application.student.toString() !== studentId) {
            return response.status(403).json({
                message: "Forbidden",
            });
        }
        const applicationHostCourseIds = application.hostCourses.map((course) => course.toString());
        const submittedCourseIds = passedHostCourses.map((exam) => exam.course);
        if (new Set(submittedCourseIds).size !== applicationHostCourseIds.length ||
            submittedCourseIds.length !== applicationHostCourseIds.length ||
            submittedCourseIds.some((courseId) => !applicationHostCourseIds.includes(courseId))) {
            return response.status(400).json({
                message: "Grades must be provided once for every host course",
            });
        }
        // Checks that the mobility has been completed before allowing the transcript upload
        if (application.status !== applications_1.ApplicationStatus.MOBILITY_COMPLETED &&
            application.status !== applications_1.ApplicationStatus.PROFESSOR_APPROVED) {
            return response.status(400).json({
                message: "Transcript of Records can only be uploaded after mobility completion or professor approval",
            });
        }
        // Saves the uploaded file path and resets the review date
        application.transcriptDocumentPath = request.file.path;
        application.transcriptUploadedAt = new Date();
        application.transcriptApproved = false;
        application.transcriptReviewDate = undefined;
        application.transcriptComment = undefined;
        application.passedHostCourses = passedHostCourses.map((exam) => ({
            course: new mongoose_1.default.Types.ObjectId(exam.course),
            grade: exam.grade.trim(),
            examDate: new Date(),
            status: "pending",
        }));
        application.status = applications_1.ApplicationStatus.WAITING_FOR_EXAM_SCORE_APPROVAL;
        await application.save();
        response.status(201).json({
            message: "Transcript of Records uploaded successfully",
            application,
        });
    }
    catch (error) {
        response
            .status(400)
            .json({ message: "Failed to upload Transcript of Records", error });
    }
});
// PATCH /api/applications/:id/complete-mobility
// Marks the mobility as complete for the authenticated student's application
router.patch("/:id/complete-mobility", auth_1.authenticate, (0, auth_1.authorize)(userRole_1.UserRole.STUDENT), async (request, response) => {
    try {
        const application = await applications_1.Applications.findById(request.params.id);
        if (!application) {
            return response.status(404).json({
                message: "Application not found",
            });
        }
        const studentId = await getStudentId(request.user.userId);
        if (!studentId) {
            return response.status(403).json({
                message: "The authenticated account is not linked to a student profile",
            });
        }
        if (application.student.toString() !== studentId) {
            return response.status(403).json({
                message: "Forbidden",
            });
        }
        // Check if the mobility is in progress before allowing it to be completed
        if (application.status !== applications_1.ApplicationStatus.MOBILITY_IN_PROGRESS) {
            return response.status(400).json({
                message: "Only a mobility in progress can be completed",
            });
        }
        if (!application.endDate || application.endDate > new Date()) {
            return response.status(400).json({
                message: "The mobility end date has not been reached yet",
            });
        }
        application.status = applications_1.ApplicationStatus.MOBILITY_COMPLETED;
        await application.save();
        response.json({
            message: "Mobility marked as completed",
            application,
        });
    }
    catch (error) {
        response.status(400).json({
            message: "Failed to complete mobility",
            error,
        });
    }
});
// PATCH /api/applications/:id
// Student can modify its own application
router.patch("/:id", auth_1.authenticate, (0, auth_1.authorize)(userRole_1.UserRole.STUDENT), upload.single("document"), async (request, response) => {
    try {
        const application = await applications_1.Applications.findById(request.params.id);
        if (!application) {
            return response.status(404).json({ message: "Application not found" });
        }
        const studentId = await getStudentId(request.user.userId);
        if (!studentId) {
            return response.status(403).json({
                message: "The authenticated account is not linked to a student profile",
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
            applications_1.ApplicationStatus.CREATED,
            applications_1.ApplicationStatus.SUBMITTED,
            applications_1.ApplicationStatus.PROFESSOR_APPROVED,
            applications_1.ApplicationStatus.OFFICE_VERIFIED,
            applications_1.ApplicationStatus.PRE_DEPARTURE_COMPLETED,
            applications_1.ApplicationStatus.MOBILITY_IN_PROGRESS,
        ].includes(application.status);
        if (!canEditApplication) {
            return response.status(400).json({
                message: "Can only modify the application while it's created, submitted or approved",
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
        const isCourseChangeRequest = request.body.homeCourses || request.body.hostCourses;
        const newHomeCourses = request.body.homeCourses
            ? JSON.parse(request.body.homeCourses)
            : undefined;
        const newHostCourses = request.body.hostCourses
            ? JSON.parse(request.body.hostCourses)
            : undefined;
        if ((newHomeCourses &&
            (!Array.isArray(newHomeCourses) ||
                newHomeCourses.length !== 3 ||
                hasDuplicateCourseIds(newHomeCourses))) ||
            (newHostCourses &&
                (!Array.isArray(newHostCourses) ||
                    newHostCourses.length !== 3 ||
                    hasDuplicateCourseIds(newHostCourses)))) {
            return response.status(400).json({
                message: "Each course list must contain exactly 3 unique courses",
            });
        }
        if (newHostCourses) {
            const validHostCourses = await exams_1.Courses.countDocuments({
                _id: { $in: newHostCourses },
                type: exams_1.CourseType.HOST,
                hostUniversity: application.hostUniversity,
            });
            if (validHostCourses !== newHostCourses.length) {
                return response.status(400).json({
                    message: "The selected host courses do not belong to this application's host university",
                });
            }
        }
        if (isCourseChangeRequest && !request.file) {
            return response.status(400).json({
                message: "A new Learning Agreement PDF is required when modifying host courses or mapping",
            });
        }
        if (request.file && isCourseChangeRequest) {
            application.proposedDocumentPath = request.file.path;
            application.courseChangeStatus = applications_1.CourseChangeStatus.PENDING;
        }
        // New mobility dates with validation
        const newStartDate = request.body.startDate;
        const newEndDate = request.body.endDate;
        if (newStartDate || newEndDate) {
            const startDateValue = newStartDate || application.startDate?.toISOString().slice(0, 10);
            const endDateValue = newEndDate || application.endDate?.toISOString().slice(0, 10);
            if (!startDateValue ||
                !endDateValue ||
                !isValidMobilityPeriod(startDateValue, endDateValue)) {
                return response.status(400).json({
                    message: "Start date must be before end date",
                });
            }
            application.startDate = new Date(startDateValue);
            application.endDate = new Date(endDateValue);
        }
        if (application.startDate &&
            new Date() >= new Date(application.startDate) &&
            application.status !== applications_1.ApplicationStatus.CLOSED &&
            application.status !== applications_1.ApplicationStatus.CANCELED) {
            application.status = applications_1.ApplicationStatus.MOBILITY_IN_PROGRESS;
        }
        // Possibility to modify courses
        if (request.body.homeCourses) {
            //application.homeCourses = JSON.parse(request.body.homeCourses);
            if (application.status === applications_1.ApplicationStatus.CREATED ||
                application.status === applications_1.ApplicationStatus.SUBMITTED) {
                application.homeCourses = newHomeCourses;
            }
            else {
                application.proposedHomeCourses = newHomeCourses;
                application.courseChangeStatus = applications_1.CourseChangeStatus.PENDING;
                application.status =
                    applications_1.ApplicationStatus.AWAITING_LEARNING_AGREEMENT_APPROVAL;
            }
        }
        if (request.body.hostCourses) {
            //application.hostCourses = JSON.parse(request.body.hostCourses);
            if (application.status === applications_1.ApplicationStatus.CREATED ||
                application.status === applications_1.ApplicationStatus.SUBMITTED) {
                application.hostCourses = newHostCourses;
            }
            else {
                application.proposedHostCourses = newHostCourses;
                application.courseChangeStatus = applications_1.CourseChangeStatus.PENDING;
                application.status =
                    applications_1.ApplicationStatus.AWAITING_LEARNING_AGREEMENT_APPROVAL;
            }
        }
        await application.save();
        response.json(application);
    }
    catch (error) {
        response
            .status(400)
            .json({ message: "Failed to upload application, error" });
    }
});
// GET /api/applications/:id
// Professor can see applications where he is the referent
// Staff can see any application
router.get("/:id", auth_1.authenticate, async (request, response) => {
    try {
        const application = await applications_1.Applications.findById(request.params.id).populate("student hostUniversity referentProfessor homeCourses hostCourses");
        if (!application) {
            response.status(404).json({ message: "Application not found" });
            return;
        }
        const studentId = await getStudentId(request.user.userId);
        if (!studentId) {
            return response.status(403).json({
                message: "The authenticated account is not linked to a student profile",
            });
        }
        if (application.student._id.toString() !== studentId) {
            return response.status(403).json({ message: "Forbidden" });
        }
        // Check permissions based on user role
        const isStudent = request.user.role === userRole_1.UserRole.STUDENT;
        const isProfessor = request.user.role === userRole_1.UserRole.PROFESSOR;
        const isStaff = request.user.role === userRole_1.UserRole.OFFICE_STAFF;
        // Professor can see only applications where he is the referent
        const isReferent = application.referentProfessor._id.toString() === request.user.userId;
        // Student can see only his own applications
        if (!studentId) {
            return response.status(403).json({
                message: "The authenticated account is not linked to a student profile",
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
    }
    catch (error) {
        response
            .status(500)
            .json({ message: "Failed to fetch application", error });
    }
});
// GET /api/applications/:id/document
// PDF download - permissions: student (owner), professor (referent), staff (all)
router.get("/:id/document", auth_1.authenticate, async (request, response) => {
    try {
        const application = await applications_1.Applications.findById(request.params.id);
        if (!application) {
            response.status(404).json({ message: "Application not found" });
            return;
        }
        // Check permissions based on user role
        const isStudent = request.user.role === userRole_1.UserRole.STUDENT;
        const isProfessor = request.user.role === userRole_1.UserRole.PROFESSOR;
        const isStaff = request.user.role === userRole_1.UserRole.OFFICE_STAFF;
        // Student can download only his own application
        const isOwner = application.student.toString() === request.user.userId;
        // Professor can download applications where he is the referent
        const isReferent = application.referentProfessor.toString() === request.user.userId;
        // Check if user has permission
        const hasPermission = (isStudent && isOwner) || (isProfessor && isReferent) || isStaff;
        if (!hasPermission) {
            response.status(403).json({ message: "Forbidden" });
            return;
        }
        response.download(application.documentPath);
    }
    catch (error) {
        response
            .status(500)
            .json({ message: "Failed to download document", error });
    }
});
// GET /api/applications/:id/transcript/document
// Student owner, referent professor, and office staff can download the transcript
router.get("/:id/transcript/document", auth_1.authenticate, async (request, response) => {
    try {
        const application = await applications_1.Applications.findById(request.params.id);
        if (!application || !application.transcriptDocumentPath) {
            return response.status(404).json({
                message: "Transcript of Records not found",
            });
        }
        // Check if the user is office staff
        const isOfficeStaff = request.user.role === userRole_1.UserRole.OFFICE_STAFF;
        if (isOfficeStaff) {
            return response.download(application.transcriptDocumentPath);
        }
        // Get the student and professor IDs for the current user
        const studentId = await getStudentId(request.user.userId);
        const professorId = await getProfessorId(request.user.userId);
        // Check if the current user is the owner (student) or the referent professor
        const isOwner = request.user.role === userRole_1.UserRole.STUDENT &&
            studentId === application.student.toString();
        const isReferent = request.user.role === userRole_1.UserRole.PROFESSOR &&
            professorId === application.referentProfessor.toString();
        if (!isOwner && !isReferent) {
            return response.status(403).json({ message: "Forbidden" });
        }
        response.download(application.transcriptDocumentPath);
    }
    catch (error) {
        response.status(500).json({
            message: "Failed to download Transcript of Records",
            error,
        });
    }
});
exports.default = router;
