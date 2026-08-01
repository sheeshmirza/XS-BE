//Done

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      index: true,
      lowercase: true,
      required: true,
      trim: true,
      type: String,
      unique: true,
    },
    emailVerificationExpiresAt: { default: undefined, type: Date },
    emailVerificationToken: { default: undefined, type: Date },
    fullName: { default: "New User", index: true, trim: true, type: String },
    isVerified: { default: true, type: Boolean },
    lastLoginAt: { default: null, type: Date },
    password: { required: true, type: String },
    resetPasswordExpiresAt: { default: undefined, type: Date },
    resetPasswordToken: { default: undefined, type: Date },
    timezone: { default: "UTC", type: String },
  },
  { timestamps: true, versionKey: false },
);

export default mongoose.model("User", userSchema);
