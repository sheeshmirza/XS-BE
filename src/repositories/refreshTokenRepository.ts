import RefreshToken from '../models/RefreshToken';
class RefreshTokenRepository { create(payload) { return RefreshToken.create(payload); }
  findByTokenHash(tokenHash) { return RefreshToken.findOne({ tokenHash }); }
  revokeById(id) { return RefreshToken.findByIdAndUpdate(id, { revokedAt: new Date() }, { new: true }); }
  revokeAllByUserId(userId) { return RefreshToken.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() }); }
  deleteExpired(now = new Date()) { return RefreshToken.deleteMany({ expiresAt: { $lt: now } }); } }
export default new RefreshTokenRepository();
