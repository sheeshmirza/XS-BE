const notificationRepository = require('../repositories/notificationRepository');

class NotificationService {
  async createNotification(payload) {
    return notificationRepository.create(payload);
  }

  async listNotifications(userId, filters, options) {
    const [items, total] = await Promise.all([
      notificationRepository.listByUserId(userId, filters, options),
      notificationRepository.countByUserId(userId, filters)
    ]);

    return { items, total };
  }
}

module.exports = new NotificationService();
