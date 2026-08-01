import socialHandleRepository from "../repositories/socialHandleRepository";
import notificationService from "./notificationService";
import notificationTypes from "../constants/notificationTypes";
import ApiError from "../utils/ApiError";
import httpStatus from "../constants/httpStatus";
import { getOAuthAdapter } from "../adapters/oauth";
import platforms from "../constants/platforms";
import {
  LinkedInAccountType,
  isLinkedInOrganizationAccountType,
  normalizeAccountTypeByPlatform,
} from "../constants/accountTypes";
const allowedPlatforms = Object.values(platforms);

type SocialServiceDeps = {
  socialHandleRepo: any;
  notifications: any;
  oauthAdapterResolver: (platform: string) => any;
};

class SocialService {
  private readonly socialHandleRepo: any;

  private readonly notifications: any;

  private readonly oauthAdapterResolver: (platform: string) => any;

  constructor(deps: SocialServiceDeps) {
    this.socialHandleRepo = deps.socialHandleRepo;
    this.notifications = deps.notifications;
    this.oauthAdapterResolver = deps.oauthAdapterResolver;
  }

  private assertSupportedPlatform(platform: string) {
    if (!allowedPlatforms.includes(platform)) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Unsupported platform");
    }
  }

  private resolveOAuthAdapter(platform: string) {
    const adapter = this.oauthAdapterResolver(platform);
    if (!adapter) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "OAuth adapter not found for platform",
      );
    }
    return adapter;
  }

  private getTokenExpiryDate(expiresIn: number) {
    return new Date(Date.now() + Number(expiresIn || 3600) * 1000);
  }

  private hasLinkedInOrganizationScopes(scopes: string[]) {
    const requiredScopes = [
      "r_organization_admin",
      "rw_organization_admin",
      "r_organization_social",
      "w_organization_social",
    ];
    return scopes.some((scope) => requiredScopes.includes(scope));
  }

  private buildSocialHandlePayload({
    userId,
    platform,
    platformUserId,
    platformUsername,
    platformDisplayName,
    accessToken,
    refreshToken,
    accessTokenExpiry,
    scopes,
    metadata,
  }) {
    return {
      userId,
      platform,
      platformUserId,
      platformUsername: platformUsername || "",
      platformDisplayName: platformDisplayName || "",
      platformAccessToken: accessToken,
      platformRefreshToken: refreshToken || "",
      platformAccessTokenExpiry: accessTokenExpiry || null,
      platformScopes: scopes || [],
      isConnected: true,
      metadata: metadata || {},
    };
  }

  private async upsertLinkedInManagedPages({
    userId,
    platform,
    managedPages,
    parentPlatformUserId,
    accessToken,
    refreshToken,
    accessTokenExpiry,
    scopes,
  }) {
    let linkedPageCount = 0;

    if (!Array.isArray(managedPages) || !managedPages.length) {
      return linkedPageCount;
    }

    for (const page of managedPages) {
      const pageIdentity = String(page.platformUserId || page.id || "").trim();
      if (!pageIdentity) {
        continue;
      }

      const pageToken = page.accessToken || accessToken;
      if (!pageToken) {
        continue;
      }

      await this.socialHandleRepo.upsertByUserPlatformIdentity(
        userId,
        platform,
        pageIdentity,
        this.buildSocialHandlePayload({
          userId,
          platform,
          platformUserId: pageIdentity,
          platformUsername: page.username || page.name,
          platformDisplayName: page.displayName || page.name,
          accessToken: pageToken,
          refreshToken,
          accessTokenExpiry,
          scopes,
          metadata: {
            ...(page.metadata || {}),
            accountType: normalizeAccountTypeByPlatform(
              platform,
              page.accountType,
            ),
            parentPlatformUserId,
          },
        }),
      );

      linkedPageCount += 1;
    }

    return linkedPageCount;
  }

  private async updateLinkedInSyncMetadata(userId, handle, changes = {}) {
    await this.socialHandleRepo.updateByIdAndUserId(handle._id, userId, {
      metadata: {
        ...(handle.metadata || {}),
        accountType: LinkedInAccountType.PERSON,
        ...changes,
      },
    });
  }

  async listAllConnectedLinkedInAccounts(userId) {
    const batchSize = 200;
    let skip = 0;
    const allAccounts: any[] = [];

    while (true) {
      const batch: any[] = await this.socialHandleRepo.listByUserId(
        userId,
        {
          platform: platforms.LINKEDIN,
          isConnected: true,
        },
        { limit: batchSize, skip },
      );

      if (!batch.length) {
        break;
      }

      allAccounts.push(...batch);
      if (batch.length < batchSize) {
        break;
      }

      skip += batchSize;
    }

    return allAccounts;
  }

  async syncLinkedInPages(userId) {
    const linkedinAccounts: any[] =
      await this.listAllConnectedLinkedInAccounts(userId);

    if (!linkedinAccounts.length) {
      return;
    }

    const adapter: any = this.oauthAdapterResolver(platforms.LINKEDIN);
    if (!adapter || typeof adapter.fetchManagedPages !== "function") {
      return;
    }

    const personalHandles = linkedinAccounts.filter((account) => {
      const accountType = account?.metadata?.accountType;
      const isChildPage = Boolean(account?.metadata?.parentPlatformUserId);
      return !isChildPage && !isLinkedInOrganizationAccountType(accountType);
    });

    for (const handle of personalHandles) {
      try {
        const managedPages = await adapter.fetchManagedPages(
          handle.platformAccessToken,
          { platformUserId: handle.platformUserId },
        );

        await this.updateLinkedInSyncMetadata(userId, handle, {
          lastPageSyncAt: new Date(),
          lastPageSyncCount: Array.isArray(managedPages)
            ? managedPages.length
            : 0,
        });

        await this.upsertLinkedInManagedPages({
          userId,
          platform: platforms.LINKEDIN,
          managedPages,
          parentPlatformUserId: handle.platformUserId,
          accessToken: handle.platformAccessToken,
          refreshToken: handle.platformRefreshToken || "",
          accessTokenExpiry: handle.platformAccessTokenExpiry || null,
          scopes: handle.platformScopes || [],
        });
      } catch (_error) {
        await this.updateLinkedInSyncMetadata(userId, handle, {
          lastPageSyncAt: new Date(),
          lastPageSyncCount: 0,
          lastPageSyncError: "LINKEDIN_PAGE_SYNC_FAILED",
        });

        // Ignore sync errors on list endpoint to keep accounts API responsive.
      }
    }
  }

  async listAccounts(userId, filters, options) {
    if (!filters.platform || filters.platform === platforms.LINKEDIN) {
      await this.syncLinkedInPages(userId);
    }

    const dbFilters: any = {};
    if (filters.platform) dbFilters.platform = filters.platform;
    if (typeof filters.isConnected === "boolean")
      dbFilters.isConnected = filters.isConnected;
    const [items, total] = await Promise.all([
      this.socialHandleRepo.listByUserId(userId, dbFilters, options),
      this.socialHandleRepo.countByUserId(userId, dbFilters),
    ]);
    return { items, total };
  }

  private buildScopes(scopeValue: string) {
    return String(scopeValue || "")
      .split(/[ ,]/)
      .filter(Boolean);
  }

  private async createConnectedNotification(userId, platform, socialHandleId) {
    await this.notifications.createNotification({
      userId,
      type: notificationTypes.SOCIAL_CONNECTED,
      title: "Social account connected",
      message: `${platform} account connected successfully`,
      metadata: { socialHandleId, platform },
    });
  }

  private async upsertPrimarySocialHandle({
    userId,
    platform,
    profilePlatformUserId,
    profile,
    accessToken,
    refreshToken,
    accessTokenExpiry,
    scopes,
  }) {
    return this.socialHandleRepo.upsertByUserPlatformIdentity(
      userId,
      platform,
      profilePlatformUserId,
      this.buildSocialHandlePayload({
        userId,
        platform,
        platformUserId: profilePlatformUserId,
        platformUsername: profile.username,
        platformDisplayName: profile.displayName,
        accessToken,
        refreshToken,
        accessTokenExpiry,
        scopes,
        metadata: {
          ...(profile.metadata || {}),
          accountType: normalizeAccountTypeByPlatform(
            platform,
            profile?.accountType,
          ),
        },
      }),
    );
  }

  getConnectUrl(userId, platform) {
    this.assertSupportedPlatform(platform);
    const adapter = this.resolveOAuthAdapter(platform);
    // State links callback context to requesting user. In production, use signed+stored state.
    const state = `${userId}:${Date.now()}`;
    return adapter.buildAuthorizeUrl(state);
  }
  async connectFromCallback(userId, platform, code, state) {
    this.assertSupportedPlatform(platform);
    const adapter = this.resolveOAuthAdapter(platform);
    const tokenResult = await adapter.exchangeCodeForToken(code, state);
    const accessToken = tokenResult.access_token;
    const refreshToken = tokenResult.refresh_token || "";
    const expiresIn = tokenResult.expires_in || 3600;
    const accessTokenExpiry = this.getTokenExpiryDate(expiresIn);
    const scopes = this.buildScopes(tokenResult.scope);
    if (!accessToken) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "No access token returned by OAuth provider",
      );
    }
    const profile: any = await adapter.fetchUserProfile(accessToken);

    const profilePlatformUserId = String(profile.platformUserId || "").trim();
    if (!profilePlatformUserId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "OAuth provider did not return a valid account identity",
      );
    }

    let socialHandle;
    try {
      socialHandle = await this.upsertPrimarySocialHandle({
        userId,
        platform,
        profilePlatformUserId,
        profile,
        accessToken,
        refreshToken,
        accessTokenExpiry,
        scopes,
      });

      let linkedPageCount = 0;
      if (typeof (adapter as any)?.fetchManagedPages === "function") {
        const managedPages = await (adapter as any).fetchManagedPages(
          accessToken,
          profile,
        );

        linkedPageCount = await this.upsertLinkedInManagedPages({
          userId,
          platform,
          managedPages,
          parentPlatformUserId: profilePlatformUserId,
          accessToken,
          refreshToken,
          accessTokenExpiry,
          scopes,
        });
      }

      if (linkedPageCount > 0) {
        socialHandle = {
          ...socialHandle.toObject(),
          linkedPageCount,
        };
      } else if (platform === platforms.LINKEDIN) {
        const hasOrganizationScopes =
          this.hasLinkedInOrganizationScopes(scopes);

        if (!hasOrganizationScopes) {
          socialHandle = {
            ...socialHandle.toObject(),
            linkedPageCount: 0,
            warning:
              "No LinkedIn company pages were found. Reconnect LinkedIn with organization scopes.",
          };
        }
      }
    } catch (error) {
      if ((error as any)?.code === 11000) {
        throw new ApiError(
          httpStatus.CONFLICT,
          `This ${platform} account/page is already linked`,
        );
      }
      throw error;
    }
    await this.createConnectedNotification(userId, platform, socialHandle._id);
    return socialHandle;
  }
  async disconnectAccount(userId, socialId) {
    const deleted = await this.socialHandleRepo.deleteByIdAndUserId(
      socialId,
      userId,
    );
    if (!deleted) {
      throw new ApiError(httpStatus.NOT_FOUND, "Social account not found");
    }
    return deleted;
  }
  async refreshPlatformToken(userId, socialId) {
    const social: any = await this.socialHandleRepo.findByIdAndUserId(
      socialId,
      userId,
    );
    if (!social) {
      throw new ApiError(httpStatus.NOT_FOUND, "Social account not found");
    }
    const adapter = this.resolveOAuthAdapter(social.platform);
    if (!social.platformRefreshToken) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "No refresh token available for this social account",
      );
    }
    const refreshed = await adapter.refreshToken(social.platformRefreshToken);
    if (!refreshed || !refreshed.access_token) {
      await this.socialHandleRepo.updateByIdAndUserId(social._id, userId, {
        isConnected: false,
      });
      await this.notifications.createNotification({
        userId,
        type: notificationTypes.TOKEN_EXPIRED,
        title: "Token expired",
        message: `${social.platform} token expired or could not be refreshed`,
        metadata: { socialHandleId: social._id, platform: social.platform },
      });
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Failed to refresh social token",
      );
    }
    return this.socialHandleRepo.updateByIdAndUserId(social._id, userId, {
      platformAccessToken: refreshed.access_token,
      platformRefreshToken:
        refreshed.refresh_token || social.platformRefreshToken,
      platformAccessTokenExpiry: refreshed.expires_in
        ? new Date(Date.now() + Number(refreshed.expires_in) * 1000)
        : social.platformAccessTokenExpiry,
      isConnected: true,
    });
  }
  listHandlesForPlatforms(userId, platformList) {
    return this.socialHandleRepo.findByUserPlatforms(userId, platformList);
  }
  countConnected(userId) {
    return this.socialHandleRepo.countByUserId(userId, { isConnected: true });
  }
}

const socialService = new SocialService({
  socialHandleRepo: socialHandleRepository,
  notifications: notificationService,
  oauthAdapterResolver: getOAuthAdapter,
});

export { SocialService };
export default socialService;
