import ApiError from "../utils/ApiError";
import httpStatus from "../constants/httpStatus";

type PostPublishServiceDeps = {
  getHandlesByAccountIds: (userId: string, accountIds: string[]) => Promise<any[]>;
  getHandlesByPlatforms: (userId: string, platforms: string[]) => Promise<any[]>;
  getPlatformService: (platform: string) => any;
};

class PostPublishService {
  private readonly getHandlesByAccountIds: (
    userId: string,
    accountIds: string[],
  ) => Promise<any[]>;

  private readonly getHandlesByPlatforms: (
    userId: string,
    platforms: string[],
  ) => Promise<any[]>;

  private readonly getPlatformService: (platform: string) => any;

  constructor(deps: PostPublishServiceDeps) {
    this.getHandlesByAccountIds = deps.getHandlesByAccountIds;
    this.getHandlesByPlatforms = deps.getHandlesByPlatforms;
    this.getPlatformService = deps.getPlatformService;
  }

  private async resolveHandles(
    userId: string,
    selectedPlatforms: string[],
    selectedAccountIds: string[],
  ) {
    const handles = selectedAccountIds.length
      ? await this.getHandlesByAccountIds(userId, selectedAccountIds)
      : await this.getHandlesByPlatforms(userId, selectedPlatforms);

    if (!handles.length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "No connected social handles available for selected accounts/platforms",
      );
    }

    return handles;
  }

  async publishToPlatforms({
    userId,
    post,
    selectedPlatforms,
    selectedAccountIds,
  }: {
    userId: string;
    post: any;
    selectedPlatforms: string[];
    selectedAccountIds: string[];
  }) {
    if (!selectedPlatforms.length && !selectedAccountIds.length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "No account or platform selected for publishing",
      );
    }

    const handles = await this.resolveHandles(
      userId,
      selectedPlatforms,
      selectedAccountIds,
    );

    const responseItems = [];
    for (const handle of handles) {
      const platformService = this.getPlatformService(handle.platform);

      const result = await platformService.publish(post, handle, {
        userId,
        handle,
      });

      responseItems.push(result);
    }

    return responseItems;
  }
}

export default PostPublishService;