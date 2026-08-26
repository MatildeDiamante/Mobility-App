// Information about the Erasmus student
import { Schema, model, Types } from "mongoose";

// Definition of the Erasmus duration
export enum ErasmusDuration {
  FIRST_SEMESTER = "Primo Semestre",
  SECOND_SEMESTER = "Secondo Semestre",
  FULL_YEAR = "Un Anno",
}

export interface Students {
  fullName: string;
  academicYear: string;
  hostUniversity: string;
  duration: ErasmusDuration;
  referentProfessor: Types.ObjectId; // Reference to the Professor model
  homeCourses: Types.ObjectId[]; // ID list of the Ca' Foscari's exams
  hostCourses: Types.ObjectId[]; // ID list of the foreign university's exams
}

const studentSchema = new Schema<Students>({
  fullName: { type: String, required: true },
  academicYear: { type: String, required: true },
  hostUniversity: { type: String, required: true },
  duration: {
    type: String,
    enum: Object.values(ErasmusDuration),
    required: true,
  },
  referentProfessor: {
    type: Schema.Types.ObjectId,
    ref: "Professors",
    required: true,
  },
  homeCourses: [{ type: Schema.Types.ObjectId, ref: "Courses" }],
  hostCourses: [{ type: Schema.Types.ObjectId, ref: "Courses" }],
});

export const Student = model<Students>("Students", studentSchema);
