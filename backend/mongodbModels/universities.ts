// Structure of the hosting universities
import mongoose, { Schema } from "mongoose";

export interface UniversityDocument {
  name: string;
}

// Definition of the Schema
const universitySchema = new Schema<UniversityDocument>({
  name: { type: String, required: true },
});

// Export of the Model
export const HostUniversities = mongoose.model<UniversityDocument>(
  "HostUniversities",
  universitySchema,
);
