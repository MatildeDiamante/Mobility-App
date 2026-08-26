// Stucture of the exams both for the ones present at Ca' Foscari and
// the others abroad
import mongoose, { Schema, model } from "mongoose";

export interface CourseDocument {
  code: string;
  name: string;
  credits: number;
}

// Definition of the Schema
const courseSchema = new Schema<CourseDocument>({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  credits: { type: Number, required: true },
});

// Export the model
export const Courses = mongoose.model<CourseDocument>("Courses", courseSchema);
