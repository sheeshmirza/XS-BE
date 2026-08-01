//Done

import mongoose from "mongoose";

const socialHandleSchema = new mongoose.Schema(
  {
    isConnected: { default: true, type: Boolean },
    metadata: { default: {}, type: mongoose.Schema.Types.Mixed },
    platform: {
      enum: ["facebook", "instagram", "linkedin", "x", "youtube"],
      required: true,
      type: String,
    },
    platformAccessToken: { required: true, type: String },
    platformAccessTokenExpiry: { default: null, type: Date },
    platformDisplayName: { default: "", type: String },
    platformRefreshToken: { default: "", type: String },
    platformScopes: { default: [], type: [String] },
    platformUsername: { default: "", type: String },
    platformUserId: { index: true, required: true, type: String },
    userId: {
      index: true,
      ref: "User",
      required: true,
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  { timestamps: true, versionKey: false },
);

export default mongoose.model("SocialHandle", socialHandleSchema);
