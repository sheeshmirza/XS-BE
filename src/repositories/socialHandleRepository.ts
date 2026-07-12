import SocialHandle from '../models/SocialHandle';
class SocialHandleRepository { create(payload) { return SocialHandle.create(payload); }
  listByUserId(userId, filters: any = {}, options: any = {}) { const query = { userId, ...filters };
    const sort = options.sort || { createdAt: -1 };
    const skip = options.skip || 0;
    const limit = options.limit || 20;
    return SocialHandle.find(query).sort(sort).skip(skip).limit(limit); }
  countByUserId(userId, filters: any = {}) { return SocialHandle.countDocuments({ userId, ...filters }); }
  findByIdAndUserId(id, userId) { return SocialHandle.findOne({ _id: id, userId }); }
  upsertByPlatformIdentity(userId, platform, platformUserId, payload) { return SocialHandle.findOneAndUpdate(
      { userId, platform, platformUserId },
      payload,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ); }
  updateByIdAndUserId(id, userId, payload) { return SocialHandle.findOneAndUpdate({ _id: id, userId }, payload, { new: true }); }
  deleteByIdAndUserId(id, userId) { return SocialHandle.findOneAndDelete({ _id: id, userId }); }
  findByUserPlatform(userId, platform) { return SocialHandle.find({ userId, platform, isConnected: true }); }
  findByUserPlatforms(userId, platforms) { return SocialHandle.find({ userId,
      platform: { $in: platforms },
      isConnected: true }); } }
export default new SocialHandleRepository();
