// Information about the application
import mongoose, { Schema, Types } from "mongoose";

//Definition of the status of the application
export enum ApplicationStatus {
  SUBMITTED = "submitted",
  PROFESSOR_APPROVED = "professor_approved",
  PROFESSOR_REJECTED = "professor_rejected",
  OFFICE_VERIFIED = "office_verified",
  COMPLETED = "completed",
}

export enum CourseChangeStatus {
  NONE = "none",
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export function canBeMarkedCompleted(application: {
  academicYear?: string;
  hostUniversity?: Types.ObjectId | string | null;
  duration?: string;
  referentProfessor?: Types.ObjectId | string | null;
  homeCourses?: Types.ObjectId[] | string[];
  hostCourses?: Types.ObjectId[] | string[];
  documentPath?: string;
  learningAgreementApproved?: boolean;
}): boolean {
  return Boolean(
    application.academicYear &&
    application.hostUniversity &&
    application.duration &&
    application.referentProfessor &&
    application.documentPath &&
    Array.isArray(application.homeCourses) &&
    application.homeCourses.length === 3 &&
    Array.isArray(application.hostCourses) &&
    application.hostCourses.length === 3 &&
    application.learningAgreementApproved === true,
  );
}

// Definition of the Model
export interface ApplicationDocument {
  student: Types.ObjectId;
  academicYear: string;
  hostUniversity: Types.ObjectId;
  duration: string;
  referentProfessor: Types.ObjectId;

  homeCourses: Types.ObjectId[];
  hostCourses: Types.ObjectId[];

  startDate?: Date;
  endDate?: Date;

  originalHomeCourses?: Types.ObjectId[];
  originalHostCourses?: Types.ObjectId[];

  proposedHomeCourses?: Types.ObjectId[];
  proposedHostCourses?: Types.ObjectId[];

  courseChangeStatus?: CourseChangeStatus;
  courseChangeComment?: string;
  courseChangeDecisionDate?: Date;

  documentPath: string;
  learningAgreementApproved?: boolean;
  status: ApplicationStatus;
  professorComment?: string;
  professorDecisionDate?: Date;
  officeComment?: string;
  officeVerificationDate?: Date;

  transcriptDocumentPath?: string;
  transcriptUploadedAt?: Date;
  transcriptApproved?: boolean;
  transcriptReviewDate?: Date;
  transcriptComment?: string;

  approvedHostCourses?: Types.ObjectId[];
  approvedHomeCourses?: Types.ObjectId[];
}

// Mongoose schema with the realtionships
const applicationSchema = new Schema<ApplicationDocument>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "Students",
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
    },
    hostUniversity: {
      type: Schema.Types.ObjectId,
      ref: "HostUniversities",
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    referentProfessor: {
      type: Schema.Types.ObjectId,
      ref: "Professors",
      required: true,
    },
    homeCourses: [
      { type: Schema.Types.ObjectId, ref: "Courses", required: true },
    ],
    hostCourses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Courses",
        required: true,
      },
    ],
    startDate: Date,
    endDate: Date,

    originalHomeCourses: [{ type: Schema.Types.ObjectId, ref: "Courses" }],
    originalHostCourses: [{ type: Schema.Types.ObjectId, ref: "Courses" }],
    proposedHomeCourses: [{ type: Schema.Types.ObjectId, ref: "Courses" }],
    proposedHostCourses: [{ type: Schema.Types.ObjectId, ref: "Courses" }],

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

    transcriptDocumentPath: String,
    transcriptUploadedAt: Date,
    transcriptApproved: {
      type: Boolean,
      default: false,
    },
    transcriptReviewDate: Date,
    transcriptComment: String,
    approvedHostCourses: [{ type: Schema.Types.ObjectId, ref: "Coourses" }],
    approvedHomeCourses: [{ type: Schema.Types.ObjectId, ref: "Courses" }],
  },
  { timestamps: true },
);

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
  const professor = await mongoose
    .model("Professors")
    .findById(this.referentProfessor);
  if (!professor || !professor.isReferent) {
    throw new Error("Selected professor is not a referent");
  }
  // check if the university is a partner
  const university = await mongoose
    .model("HostUniversities")
    .findById(this.hostUniversity);
  if (!university) {
    throw new Error("Selected university is not a partner");
  }
  next(); // called if every validation is correct
});

export const Applications = mongoose.model("Applications", applicationSchema);
