import bcrypt from "bcrypt";

import httpStatus from "../constants/httpStatus";
import env from "../config/env";
import { randomToken } from "../utils/crypto";
import ApiError from "../utils/ApiError";
import userRepository from "../repositories/userRepository";
import tokenService from "./tokenService";

class AuthService {
  async signup({ email, password }) {
    const exists = await userRepository.findByEmail(email);
    if (exists) {
      throw new ApiError(httpStatus.CONFLICT, "Email is already registered");
    }
    const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);
    const verificationToken = randomToken(32);
    const user = await userRepository.create({
      email,
      password: passwordHash,
      isVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });
    return user;
  }

  async verifyEmail(token) {
    const user = await userRepository.findByVerificationToken(token);
    if (
      !user ||
      !user.emailVerificationExpiresAt ||
      user.emailVerificationExpiresAt < new Date()
    ) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Invalid or expired verification token",
      );
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
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid credentials");
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid credentials");
    }
    if (!user.isVerified) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Please verify your email first",
      );
    }
    const accessToken = tokenService.generateAccessToken(user._id.toString());
    const refreshToken = await tokenService.generateRefreshToken(
      user._id.toString(),
      metadata,
    );
    await userRepository.updateById(user._id, {
      lastLoginAt: new Date(),
    });
    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async refresh(rawRefreshToken, metadata) {
    const rotated = await tokenService.rotateRefreshToken(
      rawRefreshToken,
      metadata,
    );
    if (!rotated) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid refresh token");
    }
    const user = await userRepository.findById(rotated.userId);
    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid refresh token user");
    }
    return {
      user,
      accessToken: rotated.accessToken,
      refreshToken: rotated.refreshToken,
    };
  }

  async logout(rawRefreshToken) {
    if (!rawRefreshToken) {
      return;
    }
    await tokenService.revokeRefreshToken(rawRefreshToken);
  }

  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return;
    }
    const resetToken = randomToken(32);
    await userRepository.updateById(user._id, {
      resetPasswordToken: resetToken,
      resetPasswordExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
  }

  async resetPassword(token, newPassword) {
    const user = await userRepository.findByResetToken(token);
    if (
      !user ||
      !user.resetPasswordExpiresAt ||
      user.resetPasswordExpiresAt < new Date()
    ) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Invalid or expired reset token",
      );
    }
    const passwordHash = await bcrypt.hash(newPassword, env.bcryptSaltRounds);
    await tokenService.revokeAllForUser(user._id);
    await userRepository.updateById(user._id, {
      password: passwordHash,
      resetPasswordToken: null,
      resetPasswordExpiresAt: null,
    });
  }
}

export default new AuthService();
