// Stucture of the exams both for the ones present at Ca' Foscari and
// the others abroad
import mongoose, { Schema, Types } from "mongoose";

// Distinguishes Ca' Foscari's exams from the ones
// held by the hosting university
export enum CourseType {
  HOME = "home",
  HOST = "host",
}

// Definition of the Model
export interface CourseDocument {
  code: string;
  name: string;
  credits: number;
  type: CourseType;
  hostUniversity?: Types.ObjectId; // match each foreign course to the corresponding hosting university
}

// Definition of the Schema
const courseSchema = new Schema<CourseDocument>({
  code: { type: String, required: true },
  name: { type: String, required: true },
  credits: { type: Number, required: true },
  type: {
    type: String,
    enum: Object.values(CourseType),
    required: true,
  },
  hostUniversity: {
    type: Schema.Types.ObjectId,
    ref: "HostUniversities",
  },
});

export const Courses = mongoose.model<CourseDocument>("Courses", courseSchema);
