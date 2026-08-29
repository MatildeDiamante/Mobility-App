// Information about the application
import mongoose, { Schema, Types } from "mongoose";

//Definition of the status of the application
export enum ApplicationStatus {
  SUBMITTED = "submitted",
  PROFESSOR_APPROVED = "professor_approved",
  PROFESSOR_REJECTED = "professor_rejected",
  OFFICE_VERIFIED = "office_verified",
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
  documentPath: string;
  status: ApplicationStatus;
  professorComment?: string;
  officeComment?: string;
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
      ref: "Profesors",
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
    documentPath: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ApplicationStatus),
      default: ApplicationStatus.SUBMITTED,
    },
    professorComment: String,
    officeComment: String,
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
