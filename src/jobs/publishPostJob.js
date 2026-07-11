const postService = require('../services/postService');

const processPublishPostJob = async ({ postId }) => {
  await postService.publishScheduledPost(postId);
};

module.exports = { processPublishPostJob };
