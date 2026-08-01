//Done

import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    isRead: { type: Boolean, default: false },
    message: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    title: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "post_failed",
        "post_published",
        "scheduled_post_published",
        "social_connected",
        "token_expired",
      ],
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);

export default mongoose.model("Notification", notificationSchema);
