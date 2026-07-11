const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: { type: String, required: true, minlength: 8 },
    isVerified: { type: Boolean, default: false, index: true },
    fullName: { type: String, trim: true, default: '' },
    avatarUrl: { type: String, default: '' },
    timezone: { type: String, default: 'UTC' },
    emailVerificationToken: { type: String, default: null, index: true },
    emailVerificationExpiresAt: { type: Date, default: null },
    resetPasswordToken: { type: String, default: null, index: true },
    resetPasswordExpiresAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

module.exports = mongoose.model('User', userSchema);
