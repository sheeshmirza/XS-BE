//Done

import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
  {
    tokenExpiresAt: { type: Date, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    tokenRevokedAt: { type: Date, default: null, index: true },
    userAgent: { type: String, default: "" },
    userIPAddress: { type: String, default: "" },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);

export default mongoose.model("RefreshToken", refreshTokenSchema);
