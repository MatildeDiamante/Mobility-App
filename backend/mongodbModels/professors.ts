// Structure of the professors
import { Schema, model } from "mongoose";

export interface Professors {
  fullName: string;
  isReferent: boolean;
}

// Definition of the Schema
const professorSchema = new Schema<Professors>({
  fullName: { type: String, required: true },
  isReferent: { type: Boolean, default: false },
});

// Export of the Model
export const professorModel = model<Professors>("Professor", professorSchema);
