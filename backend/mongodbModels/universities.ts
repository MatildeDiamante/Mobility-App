// Structure of the hosting universities
import mongoose, { Schema } from "mongoose";

// Definition of the Model
export interface UniversityDocument {
  name: string;
  country: string;
  city: string;
}

// Definition of the Schema
const universitySchema = new Schema<UniversityDocument>({
  name: { type: String, required: true },
  country: { type: String, required: true },
  city: { type: String, required: true },
});

export const HostUniversities = mongoose.model<UniversityDocument>(
  "HostUniversities",
  universitySchema,
);
