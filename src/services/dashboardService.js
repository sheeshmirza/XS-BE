const postService = require('./postService');
const socialService = require('./socialService');
const notificationService = require('./notificationService');
const { parsePagination } = require('../utils/pagination');

class DashboardService {
  async getStats(userId) {
    const [connectedAccounts, totalPosts, statusMap, platformAnalytics, recentActivity] = await Promise.all([
      socialService.countConnected(userId),
      postService.countPosts(userId),
      postService.statusBreakdown(userId),
      postService.platformBreakdown(userId),
      notificationService.listNotifications(userId, {}, { ...parsePagination({ page: 1, limit: 10 }) })
    ]);

    return {
      totalConnectedAccounts: connectedAccounts,
      totalPosts,
      scheduledPosts: statusMap.scheduled,
      publishedPosts: statusMap.published,
      failedPosts: statusMap.failed,
      platformWiseAnalytics: platformAnalytics,
      recentActivity: recentActivity.items
    };
  }
}

module.exports = new DashboardService();
