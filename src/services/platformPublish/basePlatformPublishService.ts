type PlatformPublishDeps = {
  adapterResolver: (platform: string) => any;
};

class BasePlatformPublishService {
  protected readonly platform: string;

  protected readonly adapterResolver: (platform: string) => any;

  constructor(platform: string, deps: PlatformPublishDeps) {
    this.platform = platform;
    this.adapterResolver = deps.adapterResolver;
  }

  private normalizeResult(result: any) {
    return {
      platform: this.platform,
      platformPostId: String(result?.platformPostId || ""),
      url: String(result?.url || ""),
      status: result?.status,
      message: String(result?.message || ""),
      raw: result?.raw || {},
    };
  }

  protected async afterPublish(result: any, _context: any) {
    return result;
  }

  async publish(post: any, handle: any, context: any) {
    const adapter = this.adapterResolver(this.platform);
    if (!adapter) {
      return {
        platform: this.platform,
        platformPostId: "",
        url: "",
        status: "failed",
        message: "Publish adapter not available",
        raw: {},
      };
    }

    const adapterResult = await adapter.publish(post, handle);
    const normalizedResult = this.normalizeResult(adapterResult);
    return this.afterPublish(normalizedResult, context);
  }
}

export default BasePlatformPublishService;