import axios from 'axios';
import BasePublishAdapter from './basePublishAdapter';

class InstagramPublishAdapter extends BasePublishAdapter {
    private normalizeAccessToken(token) {
        return String(token || '')
            .trim()
            .replace(/^['"`]+|['"`]+$/g, '')
            .replace(/\s+/g, '');
    }

    async publish(post, handle) {
        const igUserId = String(handle.platformUserId || '').trim();
        const initialToken = this.normalizeAccessToken(handle.platformAccessToken);
        const mediaList = Array.isArray(post?.media) ? post.media : [];
        const firstMedia = mediaList.find((item) => item?.url);
        const caption = String(post?.caption || '').trim();

        const publishWithToken = async (token) => {
            const createContainerParams: Record<string, string> = {
                access_token: token,
                caption,
            };

            const isVideo = String(firstMedia?.type || '').toLowerCase() === 'video';
            if (isVideo) {
                createContainerParams.media_type = 'VIDEO';
                createContainerParams.video_url = String(firstMedia.url).trim();
            } else {
                createContainerParams.image_url = String(firstMedia.url).trim();
            }

            const containerResponse = await axios.post(
                `https://graph.facebook.com/v19.0/${igUserId}/media`,
                null,
                {
                    params: createContainerParams,
                },
            );

            const creationId = containerResponse?.data?.id;
            if (!creationId) {
                return {
                    status: 'failed',
                    message: 'Instagram container creation failed',
                    raw: containerResponse?.data || {},
                };
            }

            const publishResponse = await axios.post(
                `https://graph.facebook.com/v19.0/${igUserId}/media_publish`,
                null,
                {
                    params: {
                        access_token: token,
                        creation_id: creationId,
                    },
                },
            );

            const platformPostId = publishResponse?.data?.id || '';
            return {
                status: 'success',
                platformPostId,
                url: platformPostId ? `https://www.instagram.com/p/${platformPostId}/` : '',
                raw: {
                    container: containerResponse?.data || {},
                    publish: publishResponse?.data || {},
                },
            };
        };

        try {
            if (!igUserId || !initialToken) {
                return {
                    status: 'failed',
                    message: 'Instagram account credentials are missing',
                    raw: {},
                };
            }

            if (!firstMedia?.url) {
                return {
                    status: 'failed',
                    message: 'Instagram publishing requires at least one media URL',
                    raw: {},
                };
            }

            return await publishWithToken(initialToken);
        } catch (error) {
            const errorMessage = String(error?.response?.data?.error?.message || error?.message || 'Instagram publish failed');
            const isTokenError = /invalid oauth access token|cannot parse access token|190/i.test(errorMessage);
            if (isTokenError) {
                const refreshToken = this.normalizeAccessToken(handle.platformRefreshToken || initialToken);
                if (refreshToken) {
                    try {
                        const refreshResponse = await axios.get('https://graph.instagram.com/refresh_access_token', {
                            params: {
                                grant_type: 'ig_refresh_token',
                                access_token: refreshToken,
                            },
                        });
                        const refreshedToken = this.normalizeAccessToken(refreshResponse?.data?.access_token);
                        if (refreshedToken) {
                            return await publishWithToken(refreshedToken);
                        }
                    } catch (_refreshError) {
                        // Fall back to the original error below.
                    }
                }
            }

            return {
                status: 'failed',
                message: errorMessage,
                raw: error?.response?.data || {},
            };
        }
    }
}
export default InstagramPublishAdapter;
