// Structure of the professors
import mongoose, { Schema } from "mongoose";

// Definition of the Model
export interface ProfessorDocument {
  fullName: string;
  isReferent: boolean;
}

// Definition of the Schema
const professorSchema = new Schema<ProfessorDocument>({
  fullName: { type: String, required: true },
  isReferent: { type: Boolean, default: false },
});

export const Professors = mongoose.model<ProfessorDocument>(
  "Professors",
  professorSchema,
);
