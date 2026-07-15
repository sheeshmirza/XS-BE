import SocialHandle from "../models/SocialHandle";
class SocialHandleRepository {
  private indexesEnsured = false;

  async ensureMultiAccountIndexes() {
    if (this.indexesEnsured) {
      return;
    }

    try {
      await SocialHandle.collection.dropIndex("uniq_user_platform");
    } catch (_error) {
      // Ignore: index may not exist in newer deployments.
    }

    await SocialHandle.collection.createIndex(
      { userId: 1, platform: 1, platformUserId: 1 },
      { unique: true, name: "uniq_user_platform_identity" },
    );

    this.indexesEnsured = true;
  }

  create(payload) {
    return SocialHandle.create(payload);
  }
  listByUserId(userId, filters: any = {}, options: any = {}) {
    const query = { userId, ...filters };
    const sort = options.sort || { createdAt: -1 };
    const skip = options.skip || 0;
    const limit = options.limit || 20;
    return SocialHandle.find(query).sort(sort).skip(skip).limit(limit);
  }
  countByUserId(userId, filters: any = {}) {
    return SocialHandle.countDocuments({ userId, ...filters });
  }
  findByIdAndUserId(id, userId) {
    return SocialHandle.findOne({ _id: id, userId });
  }

  async upsertByUserPlatformIdentity(userId, platform, platformUserId, payload) {
    await this.ensureMultiAccountIndexes();

    return SocialHandle.findOneAndUpdate(
      {
        userId,
        platform,
        platformUserId: String(platformUserId),
      },
      payload,
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );
  }
  updateByIdAndUserId(id, userId, payload) {
    return SocialHandle.findOneAndUpdate({ _id: id, userId }, payload, {
      new: true,
    });
  }
  deleteByIdAndUserId(id, userId) {
    return SocialHandle.findOneAndDelete({ _id: id, userId });
  }
  findByUserPlatform(userId, platform) {
    return SocialHandle.find({ userId, platform, isConnected: true });
  }
  findByUserPlatforms(userId, platforms) {
    return SocialHandle.find({
      userId,
      platform: { $in: platforms },
      isConnected: true,
    });
  }

  findByUserAndIds(userId, ids) {
    return SocialHandle.find({
      userId,
      _id: { $in: ids },
      isConnected: true,
    });
  }
}
export default new SocialHandleRepository();
