const axios = require('axios');
const BasePublishAdapter = require('./basePublishAdapter');

class XPublishAdapter extends BasePublishAdapter {
  async publish(post, handle) {
    try {
      const { data } = await axios.post(
        'https://api.twitter.com/2/tweets',
        { text: post.caption },
        {
          headers: {
            Authorization: `Bearer ${handle.accessToken}`
          }
        }
      );

      return {
        status: 'success',
        platformPostId: data.data?.id || '',
        url: data.data?.id ? `https://twitter.com/i/web/status/${data.data.id}` : '',
        raw: data
      };
    } catch (error) {
      return { status: 'failed', message: error.message, raw: error.response?.data || {} };
    }
  }
}

module.exports = XPublishAdapter;
