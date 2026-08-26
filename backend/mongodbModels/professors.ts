// Structure of the professors
import mongoose, { Schema, model } from "mongoose";

export interface ProfessorDocument {
  fullName: string;
  isReferent: boolean;
}

// Definition of the Schema
const professorSchema = new Schema<ProfessorDocument>({
  fullName: { type: String, required: true },
  isReferent: { type: Boolean, default: false },
});

// Export of the Model
export const Professors = mongoose.model<ProfessorDocument>("Professors", professorSchema);
