// Information about the Erasmus students
import mongoose, { Schema, Types } from "mongoose";

// Definition of the Erasmus duration
export enum ErasmusDuration {
  FIRST_SEMESTER = "Primo Semestre",
  SECOND_SEMESTER = "Secondo Semestre",
  FULL_YEAR = "Un Anno",
}

// Definition of the Model
export interface StudentDocument {
  fullName: string;
  academicYear: string;
  hostUniversity: Types.ObjectId;
  duration: ErasmusDuration;
  referentProfessor: Types.ObjectId; // Reference to the Professor model
  homeCourses: Types.ObjectId[]; // ID list of the Ca' Foscari's exams
  hostCourses: Types.ObjectId[]; // ID list of the foreign university's exams
}

// Mongoose schema with the realtionships
const studentSchema = new Schema<StudentDocument>({
  fullName: { type: String, required: true },
  academicYear: { type: String, required: true },
  hostUniversity: {
    type: Schema.Types.ObjectId,
    ref: "HostUniversities",
    required: true,
  },
  duration: {
    type: String,
    enum: Object.values(ErasmusDuration),
    required: true,
  },
  // Relationship with the referent professor
  referentProfessor: {
    type: Schema.Types.ObjectId,
    ref: "Professors",
    required: true,
  },
  // Relationship with the Ca' Foscari's exams
  homeCourses: [{ type: Schema.Types.ObjectId, ref: "Courses" }],
  // Relationship with the foreign university's exams
  hostCourses: [{ type: Schema.Types.ObjectId, ref: "Courses" }],
});

export const Students = mongoose.model<StudentDocument>(
  "Students",
  studentSchema,
);
