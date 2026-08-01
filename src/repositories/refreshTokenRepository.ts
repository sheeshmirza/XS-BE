import RefreshToken from '../models/RefreshToken';
class RefreshTokenRepository { create(payload) { return RefreshToken.create(payload); }
  findByTokenHash(tokenHash) { return RefreshToken.findOne({ tokenHash }); }
  revokeById(id) { return RefreshToken.findByIdAndUpdate(id, { tokenRevokedAt: new Date() }, { new: true }); }
  revokeAllByUserId(userId) { return RefreshToken.updateMany({ userId, tokenRevokedAt: null }, { tokenRevokedAt: new Date() }); }
  deleteExpired(now = new Date()) { return RefreshToken.deleteMany({ tokenExpiresAt: { $lt: now } }); } }
export default new RefreshTokenRepository();
