import mongoose from 'mongoose';
const platformResponseSchema = new mongoose.Schema(
  { platform: { type: String,
      enum: ['linkedin', 'instagram', 'facebook', 'x'],
      required: true },
    platformPostId: { type: String, default: '' },
    url: { type: String, default: '' },
    status: { type: String, enum: ['success', 'failed'], required: true },
    message: { type: String, default: '' },
    raw: { type: mongoose.Schema.Types.Mixed, default: {} } },
  { _id: false }
);
const mediaSchema = new mongoose.Schema(
  { type: { type: String, enum: ['image', 'video', 'gif'], required: true },
    url: { type: String, required: true },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 } },
  { _id: false }
);
const postSchema = new mongoose.Schema(
  { userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, trim: true, default: '' },
    caption: { type: String, required: true },
    hashtags: { type: [String], default: [] },
    mentions: { type: [String], default: [] },
    media: { type: [mediaSchema], default: [] },
    postType: { type: String,
      enum: ['text', 'image', 'video', 'gif', 'mixed'],
      default: 'text',
      index: true },
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
    timezone: { type: String, default: 'UTC' },
    scheduledTime: { type: Date, default: null, index: true },
    publishedTime: { type: Date, default: null, index: true },
    status: { type: String,
      enum: ['draft', 'scheduled', 'published', 'failed'],
      default: 'draft',
      index: true },
    selectedPlatforms: { type: [String],
      enum: ['linkedin', 'instagram', 'facebook', 'x'],
      default: [] },
    platformResponses: { type: [platformResponseSchema], default: [] } },
  { timestamps: true,
    versionKey: false }
);
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ userId: 1, status: 1, scheduledTime: 1 });
export default mongoose.model('Post', postSchema);
