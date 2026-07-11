const axios = require('axios');
const BasePublishAdapter = require('./basePublishAdapter');

class LinkedInPublishAdapter extends BasePublishAdapter {
  async publish(post, handle) {
    try {
      const payload = {
        author: `urn:li:person:${handle.platformUserId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: post.caption },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
      };

      const { data } = await axios.post('https://api.linkedin.com/v2/ugcPosts', payload, {
        headers: { Authorization: `Bearer ${handle.accessToken}` }
      });

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

module.exports = LinkedInPublishAdapter;
