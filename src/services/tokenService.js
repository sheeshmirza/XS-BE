const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { randomToken, sha256 } = require('../utils/crypto');
const refreshTokenRepository = require('../repositories/refreshTokenRepository');

const parseDurationToMs = (duration) => {
  const value = String(duration || '30d').trim();
  const amount = Number(value.slice(0, -1));
  const unit = value.slice(-1);

  if (Number.isNaN(amount)) return 30 * 24 * 60 * 60 * 1000;

  if (unit === 'm') return amount * 60 * 1000;
  if (unit === 'h') return amount * 60 * 60 * 1000;
  if (unit === 'd') return amount * 24 * 60 * 60 * 1000;
  return amount * 1000;
};

class TokenService {
  // Access tokens are stateless JWTs and short-lived.
  generateAccessToken(userId) {
    return jwt.sign({ sub: userId }, env.jwtAccessSecret, { expiresIn: env.jwtAccessExpiresIn });
  }

  // Refresh tokens are random opaque values persisted as SHA-256 hashes for safer storage.
  async generateRefreshToken(userId, metadata = {}) {
    const rawToken = randomToken(48);
    const tokenHash = sha256(rawToken);
    const expiresAt = new Date(Date.now() + parseDurationToMs(env.jwtRefreshExpiresIn));

    await refreshTokenRepository.create({
      userId,
      tokenHash,
      expiresAt,
      userAgent: metadata.userAgent || '',
      ipAddress: metadata.ipAddress || ''
    });

    return rawToken;
  }

  async rotateRefreshToken(rawToken, metadata = {}) {
    const tokenHash = sha256(rawToken);
    const tokenDoc = await refreshTokenRepository.findByTokenHash(tokenHash);

    if (!tokenDoc || tokenDoc.revokedAt || tokenDoc.expiresAt < new Date()) {
      return null;
    }

    // Rotation invalidates the previous refresh token to reduce replay risk.
    await refreshTokenRepository.revokeById(tokenDoc._id);

    const newRefreshToken = await this.generateRefreshToken(tokenDoc.userId, metadata);
    const accessToken = this.generateAccessToken(tokenDoc.userId.toString());

    return {
      userId: tokenDoc.userId.toString(),
      accessToken,
      refreshToken: newRefreshToken
    };
  }

  async revokeRefreshToken(rawToken) {
    const tokenHash = sha256(rawToken);
    const tokenDoc = await refreshTokenRepository.findByTokenHash(tokenHash);
    if (!tokenDoc || tokenDoc.revokedAt) return false;
    await refreshTokenRepository.revokeById(tokenDoc._id);
    return true;
  }

  async revokeAllForUser(userId) {
    await refreshTokenRepository.revokeAllByUserId(userId);
  }
}

module.exports = new TokenService();
