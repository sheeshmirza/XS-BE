import postService from '../services/postService';
const processPublishPostJob = async ({ postId }) => { await postService.publishScheduledPost(postId); };
export { processPublishPostJob };
