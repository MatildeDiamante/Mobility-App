// Information about the users
import mongoose, { Schema, Types } from "mongoose";
import { UserRole } from "./userRole";

// Definition of the Model
export interface UserDocument {
  email: string;
  passwordHash: string;
  role: UserRole;
  student?: Types.ObjectId;
  professor?: Types.ObjectId;
}

// Mongoose schema with the realtionships
const userSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: "Students",
    },
    professor: {
      type: Schema.Types.ObjectId,
      ref: "Professors",
    },
  },
  { timestamps: true },
);

export const Users = mongoose.model<UserDocument>("Users", userSchema);
