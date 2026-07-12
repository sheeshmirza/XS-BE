import Post from '../models/Post';
class PostRepository { create(payload) { return Post.create(payload); }
  findById(id) { return Post.findById(id); }
  findByIdAndUserId(id, userId) { return Post.findOne({ _id: id, userId }); }
  listByUserId(userId, filters: any = {}, options: any = {}) { const query = { userId, ...filters };
    const sort = options.sort || { createdAt: -1 };
    const skip = options.skip || 0;
    const limit = options.limit || 10;
    return Post.find(query).sort(sort).skip(skip).limit(limit); }
  countByUserId(userId, filters: any = {}) { return Post.countDocuments({ userId, ...filters }); }
  updateByIdAndUserId(id, userId, payload) { return Post.findOneAndUpdate({ _id: id, userId }, payload, { new: true }); }
  deleteByIdAndUserId(id, userId) { return Post.findOneAndDelete({ _id: id, userId }); }
  aggregateDashboard(userId) { return Post.aggregate([
      { $match: { userId } },
      { $group: { _id: '$status',
          count: { $sum: 1 } } }
    ]); }
  platformStats(userId) { return Post.aggregate([
      { $match: { userId } },
      { $unwind: '$selectedPlatforms' },
      { $group: { _id: '$selectedPlatforms',
          count: { $sum: 1 } } }
    ]); } }
export default new PostRepository();
