import BasePlatformPublishService from "./basePlatformPublishService";

class InstagramPlatformPublishService extends BasePlatformPublishService {
  constructor(deps: any) {
    super("instagram", deps);
  }
}

export default InstagramPlatformPublishService;