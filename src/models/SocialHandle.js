const mongoose = require('mongoose');

const socialHandleSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    platform: {
      type: String,
      required: true,
      enum: ['linkedin', 'instagram', 'facebook', 'x'],
      index: true
    },
    platformUserId: { type: String, required: true, index: true },
    username: { type: String, default: '' },
    displayName: { type: String, default: '' },
    profilePicture: { type: String, default: '' },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, default: '' },
    tokenExpiry: { type: Date, default: null, index: true },
    scopes: { type: [String], default: [] },
    isConnected: { type: Boolean, default: true, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

socialHandleSchema.index({ userId: 1, platform: 1 });
socialHandleSchema.index({ platform: 1, platformUserId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('SocialHandle', socialHandleSchema);
