import mongoose from "mongoose";

const socialHandleSchema = new mongoose.Schema(
  {
    isConnected: { default: true, index: true, type: Boolean },
    metadata: { default: {}, type: mongoose.Schema.Types.Mixed },
    platform: {
      enum: ["facebook", "instagram", "linkedin", "x"],
      index: true,
      required: true,
      type: String,
    },
    platformAccessToken: { required: true, type: String },
    platformAccessTokenExpiry: { default: null, index: true, type: Date },
    platformRefreshToken: { default: "", type: String },
    platformScopes: { default: [], type: [String] },
    platformUserId: { index: true, required: true, type: String },
    userProfilePicture: { default: "", type: String },
    userDisplayName: { default: "", type: String },
    userId: {
      index: true,
      ref: "User",
      required: true,
      type: mongoose.Schema.Types.ObjectId,
    },
    username: { default: "", type: String },
  },
  { timestamps: true, versionKey: false },
);

socialHandleSchema.index(
  { userId: 1, platform: 1, platformUserId: 1 },
  { unique: true, name: "uniq_user_platform_identity" },
);

export default mongoose.model("SocialHandle", socialHandleSchema);
