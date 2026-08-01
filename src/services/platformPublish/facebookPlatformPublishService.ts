import BasePlatformPublishService from "./basePlatformPublishService";

class FacebookPlatformPublishService extends BasePlatformPublishService {
  constructor(deps: any) {
    super("facebook", deps);
  }
}

export default FacebookPlatformPublishService;