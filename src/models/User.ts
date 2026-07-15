//Reviewed

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    avatarUrl: { default: "", type: String },
    email: {
      index: true,
      lowercase: true,
      required: true,
      trim: true,
      type: String,
      unique: true,
    },
    emailVerificationExpiresAt: { default: undefined, type: Date },
    emailVerificationToken: {
      default: undefined,
      index: true,
      type: String,
    },
    fullName: { default: "New User", index: true, trim: true, type: String },
    isVerified: { default: false, type: Boolean },
    lastLoginAt: { default: null, index: true, type: Date },
    password: { required: true, type: String },
    resetPasswordExpiresAt: { default: undefined, type: Date },
    resetPasswordToken: {
      default: undefined,
      index: true,
      type: String,
    },
    timezone: { default: "UTC", type: String },
  },
  { timestamps: true, versionKey: false },
);

export default mongoose.model("User", userSchema);
