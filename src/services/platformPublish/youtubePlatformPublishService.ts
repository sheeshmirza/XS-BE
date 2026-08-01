import BasePlatformPublishService from "./basePlatformPublishService";

class YouTubePlatformPublishService extends BasePlatformPublishService {
  constructor(deps: any) {
    super("youtube", deps);
  }
}

export default YouTubePlatformPublishService;