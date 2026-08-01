import BasePlatformPublishService from "./basePlatformPublishService";

type LinkedInPublishDeps = {
  adapterResolver: (platform: string) => any;
  revokeHandleAccess: (params: { handleId: string; userId: string }) => Promise<void>;
  notifyTokenExpired: (params: {
    userId: string;
    platform: string;
    socialHandleId: string;
  }) => Promise<void>;
};

class LinkedInPlatformPublishService extends BasePlatformPublishService {
  private readonly revokeHandleAccess: (params: {
    handleId: string;
    userId: string;
  }) => Promise<void>;

  private readonly notifyTokenExpired: (params: {
    userId: string;
    platform: string;
    socialHandleId: string;
  }) => Promise<void>;

  constructor(deps: LinkedInPublishDeps) {
    super("linkedin", { adapterResolver: deps.adapterResolver });
    this.revokeHandleAccess = deps.revokeHandleAccess;
    this.notifyTokenExpired = deps.notifyTokenExpired;
  }

  private isRevokedToken(result: any) {
    if (result?.status !== "failed") {
      return false;
    }

    const raw = result?.raw || {};
    const message = String(result?.message || raw?.message || "").toLowerCase();
    const code = String(raw?.code || "").toUpperCase();
    const statusCode = Number(raw?.status);
    const serviceErrorCode = Number(raw?.serviceErrorCode);

    if (code === "REVOKED_ACCESS_TOKEN" || serviceErrorCode === 65601) {
      return true;
    }

    return (
      statusCode === 401 &&
      message.includes("token") &&
      message.includes("revoked")
    );
  }

  protected async afterPublish(result: any, context: any) {
    if (!this.isRevokedToken(result)) {
      return result;
    }

    const { handle, userId } = context;

    await this.revokeHandleAccess({
      handleId: String(handle._id),
      userId: String(userId),
    });

    await this.notifyTokenExpired({
      userId,
      platform: handle.platform,
      socialHandleId: String(handle._id),
    });

    return {
      ...result,
      message:
        "LinkedIn access was revoked. Reconnect LinkedIn from Accounts, then publish again.",
    };
  }
}

export default LinkedInPlatformPublishService;