import asyncHandler from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import httpStatus from '../constants/httpStatus';
import postService from '../services/postService';
import { parsePagination } from '../utils/pagination';
const createPost = asyncHandler(async (req, res) => { const post = await postService.createPost(req.user._id, req.body);
  return sendSuccess(res, httpStatus.CREATED, 'Post created', post); });
const listPosts = asyncHandler(async (req, res) => { const { page, limit, skip } = parsePagination(req.query);
  const sort = { [req.query.sortBy || 'createdAt']: req.query.order === 'asc' ? 1 : -1 };
  const result = await postService.listPosts(req.user._id, req.query, { skip, limit, sort });
  return sendSuccess(res, httpStatus.OK, 'Posts fetched', result.items, { page,
    limit,
    total: result.total }); });
const getPost = asyncHandler(async (req, res) => { const post = await postService.getPost(req.user._id, req.params.id);
  return sendSuccess(res, httpStatus.OK, 'Post fetched', post); });
const updatePost = asyncHandler(async (req, res) => { const post = await postService.updatePost(req.user._id, req.params.id, req.body);
  return sendSuccess(res, httpStatus.OK, 'Post updated', post); });
const deletePost = asyncHandler(async (req, res) => { await postService.deletePost(req.user._id, req.params.id);
  return sendSuccess(res, httpStatus.OK, 'Post deleted'); });
const publishPost = asyncHandler(async (req, res) => { const post = await postService.publishPost(req.user._id.toString(), req.params.id, req.body.platforms || []);
  return sendSuccess(res, httpStatus.OK, 'Post publish attempted', post); });
const schedulePost = asyncHandler(async (req, res) => { const post = await postService.schedulePost(
    req.user._id.toString(),
    req.params.id,
    req.body.scheduledTime,
    req.body.timezone
  );
  return sendSuccess(res, httpStatus.OK, 'Post scheduled', post); });
export { createPost, listPosts, getPost, updatePost, deletePost, publishPost, schedulePost };
