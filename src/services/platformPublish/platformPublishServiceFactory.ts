import platforms from "../../constants/platforms";
import BasePlatformPublishService from "./basePlatformPublishService";
import FacebookPlatformPublishService from "./facebookPlatformPublishService";
import InstagramPlatformPublishService from "./instagramPlatformPublishService";
import LinkedInPlatformPublishService from "./linkedinPlatformPublishService";
import XPlatformPublishService from "./xPlatformPublishService";
import YouTubePlatformPublishService from "./youtubePlatformPublishService";

type PlatformPublishServiceFactoryDeps = {
  adapterResolver: (platform: string) => any;
  revokeLinkedInHandleAccess: (params: {
    handleId: string;
    userId: string;
  }) => Promise<void>;
  notifyLinkedInTokenExpired: (params: {
    userId: string;
    platform: string;
    socialHandleId: string;
  }) => Promise<void>;
};

class PlatformPublishServiceFactory {
  private readonly services: Map<string, any>;

  private readonly adapterResolver: (platform: string) => any;

  constructor(deps: PlatformPublishServiceFactoryDeps) {
    this.adapterResolver = deps.adapterResolver;
    const sharedDeps = {
      adapterResolver: this.adapterResolver,
    };

    this.services = new Map<string, any>([
      [platforms.FACEBOOK, new FacebookPlatformPublishService(sharedDeps)],
      [platforms.INSTAGRAM, new InstagramPlatformPublishService(sharedDeps)],
      [
        platforms.LINKEDIN,
        new LinkedInPlatformPublishService({
          ...sharedDeps,
          revokeHandleAccess: deps.revokeLinkedInHandleAccess,
          notifyTokenExpired: deps.notifyLinkedInTokenExpired,
        }),
      ],
      [platforms.X, new XPlatformPublishService(sharedDeps)],
      [platforms.YOUTUBE, new YouTubePlatformPublishService(sharedDeps)],
    ]);
  }

  getService(platform: string) {
    const existing = this.services.get(platform);
    if (existing) {
      return existing;
    }

    const fallbackService = new BasePlatformPublishService(platform, {
      adapterResolver: this.adapterResolver,
    });
    this.services.set(platform, fallbackService);
    return fallbackService;
  }
}

export default PlatformPublishServiceFactory;