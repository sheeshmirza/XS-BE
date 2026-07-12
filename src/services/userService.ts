import bcrypt from 'bcrypt';
import env from '../config/env';
import userRepository from '../repositories/userRepository';
import refreshTokenRepository from '../repositories/refreshTokenRepository';
class UserService { getUserById(userId) { return userRepository.findById(userId); }
  getUserByEmail(email) { return userRepository.findByEmail(email); }
  async updateProfile(userId, payload) { const updatePayload = { fullName: payload.fullName,
      avatarUrl: payload.avatarUrl,
      timezone: payload.timezone };
    return userRepository.updateById(userId, updatePayload); }
  async changePassword(userId, oldPassword, newPassword) { const user = await userRepository.findById(userId);
    if (!user) return null;
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return false;
    const hash = await bcrypt.hash(newPassword, env.bcryptSaltRounds);
    await userRepository.updateById(userId, { password: hash });
    await refreshTokenRepository.revokeAllByUserId(userId);
    return true; }
  async deleteUser(userId) { await refreshTokenRepository.revokeAllByUserId(userId);
    return userRepository.deleteById(userId); } }
export default new UserService();
