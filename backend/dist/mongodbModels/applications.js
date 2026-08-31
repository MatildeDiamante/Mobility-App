"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Applications = exports.CourseChangeStatus = exports.ApplicationStatus = void 0;
exports.canBeMarkedCompleted = canBeMarkedCompleted;
// Information about the application
const mongoose_1 = __importStar(require("mongoose"));
// Definition of the general application lifecycle
var ApplicationStatus;
(function (ApplicationStatus) {
    ApplicationStatus["CREATED"] = "created";
    ApplicationStatus["SUBMITTED"] = "submitted";
    ApplicationStatus["AWAITING_LEARNING_AGREEMENT_APPROVAL"] = "awaiting_learning_agreement_approval";
    ApplicationStatus["PRE_DEPARTURE_COMPLETED"] = "pre_departure_completed";
    ApplicationStatus["MOBILITY_IN_PROGRESS"] = "mobility_in_progress";
    ApplicationStatus["WAITING_FOR_EXAM_SCORE_APPROVAL"] = "waiting_for_exam_score_approval";
    ApplicationStatus["PROFESSOR_APPROVED"] = "professor_approved";
    ApplicationStatus["OFFICE_VERIFIED"] = "office_verified";
    ApplicationStatus["CLOSED"] = "closed";
    ApplicationStatus["CANCELED"] = "canceled";
})(ApplicationStatus || (exports.ApplicationStatus = ApplicationStatus = {}));
// Definition of the modified courses
var CourseChangeStatus;
(function (CourseChangeStatus) {
    CourseChangeStatus["NONE"] = "none";
    CourseChangeStatus["PENDING"] = "pending";
    CourseChangeStatus["APPROVED"] = "approved";
    CourseChangeStatus["REJECTED"] = "rejected";
})(CourseChangeStatus || (exports.CourseChangeStatus = CourseChangeStatus = {}));
function canBeMarkedCompleted(application) {
    return Boolean(application.academicYear &&
        application.hostUniversity &&
        application.duration &&
        application.referentProfessor &&
        application.documentPath &&
        Array.isArray(application.homeCourses) &&
        application.homeCourses.length === 3 &&
        Array.isArray(application.hostCourses) &&
        application.hostCourses.length === 3 &&
        application.learningAgreementApproved === true);
}
// Mongoose schema with the realtionships
const applicationSchema = new mongoose_1.Schema({
    student: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Students",
        required: true,
    },
    academicYear: {
        type: String,
        required: true,
    },
    hostUniversity: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "HostUniversities",
        required: true,
    },
    duration: {
        type: String,
        required: true,
    },
    referentProfessor: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Professors",
        required: true,
    },
    homeCourses: [
        { type: mongoose_1.Schema.Types.ObjectId, ref: "Courses", required: true },
    ],
    hostCourses: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Courses",
            required: true,
        },
    ],
    startDate: Date,
    endDate: Date,
    originalHomeCourses: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Courses" }],
    originalHostCourses: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Courses" }],
    proposedHomeCourses: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Courses" }],
    proposedHostCourses: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Courses" }],
    courseChangeStatus: {
        type: String,
        enum: Object.values(CourseChangeStatus),
        default: CourseChangeStatus.NONE,
    },
    courseChangeComment: String,
    courseChangeDecisionDate: Date,
    documentPath: {
        type: String,
        required: true,
    },
    learningAgreementApproved: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: Object.values(ApplicationStatus),
        default: ApplicationStatus.SUBMITTED,
    },
    professorComment: String,
    professorDecisionDate: Date,
    officeComment: String,
    officeVerificationDate: Date,
    passedHostCourses: [
        {
            course: { type: mongoose_1.Schema.Types.ObjectId, ref: "Courses" },
            grade: String,
            examDate: Date,
            status: {
                type: String,
                enum: ["pending", "approved", "rejected"],
                default: "pending",
            },
            comment: String,
        },
    ],
    transcriptDocumentPath: String,
    transcriptUploadedAt: Date,
    transcriptApproved: {
        type: Boolean,
        default: false,
    },
    transcriptReviewDate: Date,
    transcriptComment: String,
    approvedHostCourses: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Coourses" }],
    approvedHomeCourses: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Courses" }],
}, { timestamps: true });
// Custom validations for applications
applicationSchema.pre("save", async function (next) {
    // checks if three Ca' Foscari exams are selected
    if (this.homeCourses.length !== 3) {
        throw new Error("3 Ca' Foscari courses are required");
    }
    // checks if three exams from the foreign university are selected
    if (this.hostCourses.length !== 3) {
        throw new Error("3 host University courses are required");
    }
    // checks if the professor is a referent
    const professor = await mongoose_1.default
        .model("Professors")
        .findById(this.referentProfessor);
    if (!professor || !professor.isReferent) {
        throw new Error("Selected professor is not a referent");
    }
    // check if the university is a partner
    const university = await mongoose_1.default
        .model("HostUniversities")
        .findById(this.hostUniversity);
    if (!university) {
        throw new Error("Selected university is not a partner");
    }
    next(); // called if every validation is correct
});
exports.Applications = mongoose_1.default.model("Applications", applicationSchema);
