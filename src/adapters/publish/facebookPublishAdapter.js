const axios = require('axios');
const BasePublishAdapter = require('./basePublishAdapter');

class FacebookPublishAdapter extends BasePublishAdapter {
  async publish(post, handle) {
    try {
      const { data } = await axios.post(
        `https://graph.facebook.com/${handle.platformUserId}/feed`,
        null,
        {
          params: {
            message: post.caption,
            access_token: handle.accessToken
          }
        }
      );

      return {
        status: 'success',
        platformPostId: data.id || '',
        url: '',
        raw: data
      };
    } catch (error) {
      return { status: 'failed', message: error.message, raw: error.response?.data || {} };
    }
  }
}

module.exports = FacebookPublishAdapter;
