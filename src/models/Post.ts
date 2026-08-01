import mongoose from "mongoose";

const platformResponseSchema = new mongoose.Schema(
  {
    message: { type: String, default: "" },
    platform: {
      type: String,
      enum: ["facebook", "instagram", "linkedin", "twitter", "x", "youtube"],
      required: true,
    },
    platformPostId: { type: String, default: "" },
    raw: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ["failed", "success"], required: true },
    url: { type: String, default: "" },
  },
  { _id: false },
);

const mediaSchema = new mongoose.Schema(
  {
    mimeType: { type: String, default: "" },
    size: { type: Number, default: 0 },
    type: { type: String, enum: ["gif", "image", "video"], required: true },
    url: { type: String, required: true },
  },
  { _id: false },
);

const postSchema = new mongoose.Schema(
  {
    caption: { type: String, default: "" },
    hashtags: { type: [String], default: [] },
    media: { type: [mediaSchema], default: [] },
    mentions: { type: [String], default: [] },
    platformResponses: { type: [platformResponseSchema], default: [] },
    postType: {
      type: String,
      enum: ["gif", "image", "mixed", "text", "video"],
      default: "text",
      index: true,
    },
    publishedTime: { type: Date, default: null, index: true },
    recurrence: {
      type: String,
      enum: ["daily", "hourly", "monthly", "once", "weekly", "yearly"],
      default: "once",
      index: true,
    },
    scheduledTime: { type: Date, default: null, index: true },
    selectedAccountIds: { type: [String], default: [] },
    selectedPlatforms: {
      type: [String],
      enum: ["facebook", "instagram", "linkedin", "twitter", "x", "youtube"],
      default: [],
    },
    status: {
      type: String,
      enum: ["draft", "failed", "published", "scheduled"],
      default: "draft",
      index: true,
    },
    timezone: { type: String, default: "UTC" },
    title: { type: String, trim: true, default: "" },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "public",
    },
  },
  { timestamps: true, versionKey: false },
);

export default mongoose.model("Post", postSchema);
