import axios from 'axios';
import BasePublishAdapter from './basePublishAdapter';

class InstagramPublishAdapter extends BasePublishAdapter {
    async publish(post, handle) {
        try {
            const igUserId = String(handle.platformUserId || '').trim();
            const token = String(handle.platformAccessToken || '').trim();
            const mediaList = Array.isArray(post?.media) ? post.media : [];
            const firstMedia = mediaList.find((item) => item?.url);
            const caption = String(post?.caption || '').trim();

            if (!igUserId || !token) {
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

            const mediaUrl = String(firstMedia.url).trim();
            const isVideo = String(firstMedia.type || '').toLowerCase() === 'video';

            const createContainerUrl = `https://graph.facebook.com/v19.0/${igUserId}/media`;
            const createContainerParams: Record<string, string> = {
                access_token: token,
                caption,
            };

            if (isVideo) {
                createContainerParams.media_type = 'VIDEO';
                createContainerParams.video_url = mediaUrl;
            } else {
                createContainerParams.image_url = mediaUrl;
            }

            const containerResponse = await axios.post(createContainerUrl, null, {
                params: createContainerParams,
            });

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
        } catch (error) {
            return {
                status: 'failed',
                message: error?.message || 'Instagram publish failed',
                raw: error?.response?.data || {},
            };
        }
    }
}
export default InstagramPublishAdapter;
