import socialHandleRepository from "../repositories/socialHandleRepository";
import notificationService from "./notificationService";
import notificationTypes from "../constants/notificationTypes";
import ApiError from "../utils/ApiError";
import httpStatus from "../constants/httpStatus";
import { getOAuthAdapter } from "../adapters/oauth";
import platforms from "../constants/platforms";
const allowedPlatforms = Object.values(platforms);
class SocialService {
  async listAccounts(userId, filters, options) {
    const dbFilters: any = {};
    if (filters.platform) dbFilters.platform = filters.platform;
    if (typeof filters.isConnected === "boolean")
      dbFilters.isConnected = filters.isConnected;
    const [items, total] = await Promise.all([
      socialHandleRepository.listByUserId(userId, dbFilters, options),
      socialHandleRepository.countByUserId(userId, dbFilters),
    ]);
    return { items, total };
  }
  getConnectUrl(userId, platform) {
    if (!allowedPlatforms.includes(platform)) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Unsupported platform");
    }
    const adapter = getOAuthAdapter(platform);
    if (!adapter) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "OAuth adapter not found for platform",
      );
    }
    // State links callback context to requesting user. In production, use signed+stored state.
    const state = `${userId}:${Date.now()}`;
    return adapter.buildAuthorizeUrl(state);
  }
  async connectFromCallback(userId, platform, code) {
    const adapter = getOAuthAdapter(platform);
    if (!adapter) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "OAuth adapter not found for platform",
      );
    }
    const tokenResult = await adapter.exchangeCodeForToken(code);
    const accessToken = tokenResult.access_token;
    const refreshToken = tokenResult.refresh_token || "";
    const expiresIn = tokenResult.expires_in || 3600;
    const scopes = (tokenResult.scope || "").split(/[ ,]/).filter(Boolean);
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
      socialHandle = await socialHandleRepository.upsertByUserPlatformIdentity(
        userId,
        platform,
        profilePlatformUserId,
        {
          userId,
          platform,
          platformUserId: profilePlatformUserId,
          username: profile.username || "",
          userDisplayName: profile.displayName || "",
          userProfilePicture: profile.profilePicture || "",
          platformAccessToken: accessToken,
          platformRefreshToken: refreshToken,
          platformAccessTokenExpiry: new Date(Date.now() + expiresIn * 1000),
          platformScopes: scopes,
          isConnected: true,
          metadata: profile.metadata || {},
        },
      );

      let linkedPageCount = 0;
      if (typeof adapter.fetchManagedPages === "function") {
        const managedPages = await adapter.fetchManagedPages(
          accessToken,
          profile,
        );

        if (Array.isArray(managedPages) && managedPages.length > 0) {
          for (const page of managedPages) {
            const pageIdentity = String(page.platformUserId || page.id || "").trim();
            if (!pageIdentity) {
              continue;
            }

            const pageToken = page.accessToken || accessToken;
            if (!pageToken) {
              continue;
            }

            await socialHandleRepository.upsertByUserPlatformIdentity(
              userId,
              platform,
              pageIdentity,
              {
                userId,
                platform,
                platformUserId: pageIdentity,
                username: page.username || page.name || "",
                userDisplayName: page.displayName || page.name || "",
                userProfilePicture: page.profilePicture || "",
                platformAccessToken: pageToken,
                platformRefreshToken: refreshToken,
                platformAccessTokenExpiry: new Date(Date.now() + expiresIn * 1000),
                platformScopes: scopes,
                isConnected: true,
                metadata: {
                  ...(page.metadata || {}),
                  accountType: page.accountType || "page",
                  parentPlatformUserId: profilePlatformUserId,
                },
              },
            );

            linkedPageCount += 1;
          }
        }
      }

      if (linkedPageCount > 0) {
        socialHandle = {
          ...socialHandle.toObject(),
          linkedPageCount,
        };
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
    await notificationService.createNotification({
      userId,
      type: notificationTypes.SOCIAL_CONNECTED,
      title: "Social account connected",
      message: `${platform} account connected successfully`,
      metadata: { socialHandleId: socialHandle._id, platform },
    });
    return socialHandle;
  }
  async disconnectAccount(userId, socialId) {
    const deleted = await socialHandleRepository.deleteByIdAndUserId(
      socialId,
      userId,
    );
    if (!deleted) {
      throw new ApiError(httpStatus.NOT_FOUND, "Social account not found");
    }
    return deleted;
  }
  async refreshPlatformToken(userId, socialId) {
    const social: any = await socialHandleRepository.findByIdAndUserId(
      socialId,
      userId,
    );
    if (!social) {
      throw new ApiError(httpStatus.NOT_FOUND, "Social account not found");
    }
    const adapter = getOAuthAdapter(social.platform);
    if (!adapter) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "OAuth adapter not found for platform",
      );
    }
    if (!social.platformRefreshToken) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "No refresh token available for this social account",
      );
    }
    const refreshed = await adapter.refreshToken(social.platformRefreshToken);
    if (!refreshed || !refreshed.access_token) {
      await socialHandleRepository.updateByIdAndUserId(social._id, userId, {
        isConnected: false,
      });
      await notificationService.createNotification({
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
    return socialHandleRepository.updateByIdAndUserId(social._id, userId, {
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
    return socialHandleRepository.findByUserPlatforms(userId, platformList);
  }
  countConnected(userId) {
    return socialHandleRepository.countByUserId(userId, { isConnected: true });
  }
}
export default new SocialService();
