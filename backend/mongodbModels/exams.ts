// Stucture of the exams both for the ones present at Ca' Foscari and
// the others abroad
import { Schema, model } from "mongoose";

export interface Courses {
  code: string;
  name: string;
  credits: number;
}

// Definition of the Schema
const courseSchema = new Schema<Courses>({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  credits: { type: Number, required: true },
});

// Export the model
export const courseModel = model<Courses>("examModel", courseSchema);
