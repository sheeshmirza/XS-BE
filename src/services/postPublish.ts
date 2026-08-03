import { getPublishAdapter } from "../adapters/publish";
import notificationTypes from "../constants/notificationTypes";
import socialHandleRepository from "../repositories/socialHandleRepository";
import notificationService from "./notificationService";
import socialService from "./socialService";
import PostPublishService from "./postPublishService";
import PlatformPublishServiceFactory from "./platformPublish/platformPublishServiceFactory";

const platformPublishServiceFactory = new PlatformPublishServiceFactory({
  adapterResolver: getPublishAdapter,
  revokeLinkedInHandleAccess: async ({ handleId, userId }) => {
    await socialHandleRepository.updateByIdAndUserId(handleId, userId, {
      isConnected: false,
      platformAccessToken: "",
      platformRefreshToken: "",
      platformAccessTokenExpiry: null,
    });
  },
  notifyLinkedInTokenExpired: async ({ userId, platform, socialHandleId }) => {
    await notificationService.createNotification({
      userId,
      type: notificationTypes.TOKEN_EXPIRED,
      title: "LinkedIn re-authentication required",
      message:
        "Your LinkedIn session was revoked. Reconnect LinkedIn from the Accounts page.",
      metadata: { platform, socialHandleId },
    });
  },
});

const postPublishService = new PostPublishService({
  getHandlesByAccountIds: (userId, accountIds) =>
    socialHandleRepository.findByUserAndIds(userId, accountIds),
  getHandlesByPlatforms: (userId, platformList) =>
    socialService.listHandlesForPlatforms(userId, platformList),
  ensureFreshHandle: (userId, handle) =>
    socialService.refreshPlatformTokenIfNeeded(userId, handle),
  getPlatformService: (platform) => platformPublishServiceFactory.getService(platform),
});

export default postPublishService;
