import BasePlatformPublishService from "./basePlatformPublishService";

class XPlatformPublishService extends BasePlatformPublishService {
  constructor(deps: any) {
    super("x", deps);
  }
}

export default XPlatformPublishService;