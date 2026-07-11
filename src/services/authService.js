const bcrypt = require('bcrypt');
const userRepository = require('../repositories/userRepository');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const httpStatus = require('../constants/httpStatus');
const tokenService = require('./tokenService');
const emailService = require('./emailService');
const { randomToken } = require('../utils/crypto');

class AuthService {
  async signup({ email, password }) {
    const exists = await userRepository.findByEmail(email);
    if (exists) {
      throw new ApiError(httpStatus.CONFLICT, 'Email is already registered');
    }

    const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);
    const verificationToken = randomToken(24);

    // Keep signup lean: create account, then trigger asynchronous user-facing actions.
    const user = await userRepository.create({
      email,
      password: passwordHash,
      isVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    await emailService.sendVerificationEmail(user.email, verificationToken);

    return user;
  }

  async verifyEmail(token) {
    const user = await userRepository.findByVerificationToken(token);
    if (!user || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired verification token');
    }

    user.isVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpiresAt = null;
    await user.save();

    return user;
  }

  async login({ email, password }, metadata) {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid credentials');
    }

    // Session pair: stateless access token + persisted refresh token.
    const accessToken = tokenService.generateAccessToken(user._id.toString());
    const refreshToken = await tokenService.generateRefreshToken(user._id.toString(), metadata);

    await userRepository.updateById(user._id, { lastLoginAt: new Date() });

    return { user, accessToken, refreshToken };
  }

  async refresh(rawRefreshToken, metadata) {
    const rotated = await tokenService.rotateRefreshToken(rawRefreshToken, metadata);

    if (!rotated) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token');
    }

    const user = await userRepository.findById(rotated.userId);
    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token user');
    }

    return {
      user,
      accessToken: rotated.accessToken,
      refreshToken: rotated.refreshToken
    };
  }

  async logout(rawRefreshToken, userId) {
    if (rawRefreshToken) {
      await tokenService.revokeRefreshToken(rawRefreshToken);
    }

    if (userId) {
      await tokenService.revokeAllForUser(userId);
    }
  }

  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) return;

    const resetToken = randomToken(24);
    await userRepository.updateById(user._id, {
      resetPasswordToken: resetToken,
      resetPasswordExpiresAt: new Date(Date.now() + 60 * 60 * 1000)
    });

    await emailService.sendResetPasswordEmail(email, resetToken);
  }

  async resetPassword(token, newPassword) {
    const user = await userRepository.findByResetToken(token);

    if (!user || !user.resetPasswordExpiresAt || user.resetPasswordExpiresAt < new Date()) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired reset token');
    }

    const hash = await bcrypt.hash(newPassword, env.bcryptSaltRounds);

    await userRepository.updateById(user._id, {
      password: hash,
      resetPasswordToken: null,
      resetPasswordExpiresAt: null
    });

    await tokenService.revokeAllForUser(user._id);
  }
}

module.exports = new AuthService();
