import Notification from '../models/Notification';
class NotificationRepository { create(payload) { return Notification.create(payload); }
  listByUserId(userId, filters = {}, options: any = {}) { const query = { userId, ...filters };
    const sort = options.sort || { createdAt: -1 };
    const skip = options.skip || 0;
    const limit = options.limit || 20;
    return Notification.find(query).sort(sort).skip(skip).limit(limit); }
  countByUserId(userId, filters: any = {}) { return Notification.countDocuments({ userId, ...filters }); } }
export default new NotificationRepository();
