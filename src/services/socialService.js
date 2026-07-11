const socialHandleRepository = require('../repositories/socialHandleRepository');
const notificationService = require('./notificationService');
const notificationTypes = require('../constants/notificationTypes');
const ApiError = require('../utils/ApiError');
const httpStatus = require('../constants/httpStatus');
const { getOAuthAdapter } = require('../adapters/oauth');
const platforms = require('../constants/platforms');

const allowedPlatforms = Object.values(platforms);

class SocialService {
  async listAccounts(userId, filters, options) {
    const dbFilters = {};
    if (filters.platform) dbFilters.platform = filters.platform;
    if (typeof filters.isConnected === 'boolean') dbFilters.isConnected = filters.isConnected;

    const [items, total] = await Promise.all([
      socialHandleRepository.listByUserId(userId, dbFilters, options),
      socialHandleRepository.countByUserId(userId, dbFilters)
    ]);

    return { items, total };
  }

  getConnectUrl(userId, platform) {
    if (!allowedPlatforms.includes(platform)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Unsupported platform');
    }

    const adapter = getOAuthAdapter(platform);
    if (!adapter) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'OAuth adapter not found for platform');
    }

    // State links callback context to requesting user. In production, use signed+stored state.
    const state = `${userId}:${Date.now()}`;
    return adapter.buildAuthorizeUrl(state);
  }

  async connectFromCallback(userId, platform, code) {
    const adapter = getOAuthAdapter(platform);
    if (!adapter) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'OAuth adapter not found for platform');
    }

    const tokenResult = await adapter.exchangeCodeForToken(code);
    const accessToken = tokenResult.access_token;
    const refreshToken = tokenResult.refresh_token || '';
    const expiresIn = tokenResult.expires_in || 3600;
    const scopes = (tokenResult.scope || '').split(/[ ,]/).filter(Boolean);

    if (!accessToken) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'No access token returned by OAuth provider');
    }

    const profile = await adapter.fetchUserProfile(accessToken);

    // Upsert allows multiple accounts per platform while avoiding exact duplicate platform identities.
    const socialHandle = await socialHandleRepository.upsertByPlatformIdentity(
      userId,
      platform,
      String(profile.platformUserId),
      {
        userId,
        platform,
        platformUserId: String(profile.platformUserId),
        username: profile.username || '',
        displayName: profile.displayName || '',
        profilePicture: profile.profilePicture || '',
        accessToken,
        refreshToken,
        tokenExpiry: new Date(Date.now() + expiresIn * 1000),
        scopes,
        isConnected: true,
        metadata: profile.metadata || {}
      }
    );

    await notificationService.createNotification({
      userId,
      type: notificationTypes.SOCIAL_CONNECTED,
      title: 'Social account connected',
      message: `${platform} account connected successfully`,
      metadata: { socialHandleId: socialHandle._id, platform }
    });

    return socialHandle;
  }

  async disconnectAccount(userId, socialId) {
    const deleted = await socialHandleRepository.deleteByIdAndUserId(socialId, userId);
    if (!deleted) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Social account not found');
    }
    return deleted;
  }

  async refreshPlatformToken(userId, socialId) {
    const social = await socialHandleRepository.findByIdAndUserId(socialId, userId);
    if (!social) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Social account not found');
    }

    const adapter = getOAuthAdapter(social.platform);
    if (!adapter) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'OAuth adapter not found for platform');
    }

    if (!social.refreshToken) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'No refresh token available for this social account');
    }

    const refreshed = await adapter.refreshToken(social.refreshToken);

    if (!refreshed || !refreshed.access_token) {
      await socialHandleRepository.updateByIdAndUserId(social._id, userId, { isConnected: false });

      await notificationService.createNotification({
        userId,
        type: notificationTypes.TOKEN_EXPIRED,
        title: 'Token expired',
        message: `${social.platform} token expired or could not be refreshed`,
        metadata: { socialHandleId: social._id, platform: social.platform }
      });

      throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to refresh social token');
    }

    return socialHandleRepository.updateByIdAndUserId(social._id, userId, {
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token || social.refreshToken,
      tokenExpiry: refreshed.expires_in
        ? new Date(Date.now() + Number(refreshed.expires_in) * 1000)
        : social.tokenExpiry,
      isConnected: true
    });
  }

  listHandlesForPlatforms(userId, platformList) {
    return socialHandleRepository.findByUserPlatforms(userId, platformList);
  }

  countConnected(userId) {
    return socialHandleRepository.countByUserId(userId, { isConnected: true });
  }
}

module.exports = new SocialService();
