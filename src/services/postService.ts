import mongoose from "mongoose";
import postRepository from "../repositories/postRepository";
import socialService from "./socialService";
import notificationService from "./notificationService";
import postStatus from "../constants/postStatus";
import notificationTypes from "../constants/notificationTypes";
import ApiError from "../utils/ApiError";
import httpStatus from "../constants/httpStatus";
import { getPublishAdapter } from "../adapters/publish";
import { addSchedulePublishJob } from "../queue/postQueue";
import socialHandleRepository from "../repositories/socialHandleRepository";

const isRevokedLinkedInToken = (platform, result) => {
  if (platform !== "linkedin" || result?.status !== "failed") {
    return false;
  }

  const raw = result?.raw || {};
  const message = String(result?.message || raw?.message || "").toLowerCase();
  const code = String(raw?.code || "").toUpperCase();
  const statusCode = Number(raw?.status);
  const serviceErrorCode = Number(raw?.serviceErrorCode);

  if (code === "REVOKED_ACCESS_TOKEN" || serviceErrorCode === 65601) {
    return true;
  }

  return (
    statusCode === 401 &&
    message.includes("token") &&
    message.includes("revoked")
  );
};
class PostService {
  createPost(userId, payload) {
    return postRepository.create({
      userId,
      title: payload.title,
      caption: payload.caption,
      hashtags: payload.hashtags || [],
      mentions: payload.mentions || [],
      media: payload.media || [],
      postType: payload.postType,
      visibility: payload.visibility,
      timezone: payload.timezone || "UTC",
      scheduledTime: payload.scheduledTime || null,
      status: payload.status || postStatus.DRAFT,
      selectedPlatforms: payload.selectedPlatforms || [],
      selectedAccountIds: payload.selectedAccountIds || [],
    });
  }
  async listPosts(userId, query, options) {
    const filters: any = {};
    if (query.status) (filters as any).status = query.status;
    if (query.postType) (filters as any).postType = query.postType;
    if (query.search) {
      (filters as any).$or = [
        { title: { $regex: query.search, $options: "i" } },
        { caption: { $regex: query.search, $options: "i" } },
      ];
    }
    const [items, total] = await Promise.all([
      postRepository.listByUserId(userId, filters, options),
      postRepository.countByUserId(userId, filters),
    ]);
    return { items, total };
  }
  async getPost(userId, postId) {
    const post = await postRepository.findByIdAndUserId(postId, userId);
    if (!post) {
      throw new ApiError(httpStatus.NOT_FOUND, "Post not found");
    }
    return post;
  }
  async updatePost(userId, postId, payload) {
    const updated = await postRepository.updateByIdAndUserId(
      postId,
      userId,
      payload,
    );
    if (!updated) {
      throw new ApiError(httpStatus.NOT_FOUND, "Post not found");
    }
    return updated;
  }
  async deletePost(userId, postId) {
    const deleted = await postRepository.deleteByIdAndUserId(postId, userId);
    if (!deleted) {
      throw new ApiError(httpStatus.NOT_FOUND, "Post not found");
    }
    return deleted;
  }
  async publishPost(userId, postId, platformList = [], accountIdList = []) {
    const post = await this.getPost(userId, postId);
    const selectedPlatforms =
      platformList.length > 0 ? platformList : post.selectedPlatforms;
    const selectedAccountIds =
      accountIdList.length > 0 ? accountIdList : post.selectedAccountIds || [];

    if (!selectedPlatforms.length && !selectedAccountIds.length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "No account or platform selected for publishing",
      );
    }

    const handles = selectedAccountIds.length
      ? await socialHandleRepository.findByUserAndIds(userId, selectedAccountIds)
      : await socialService.listHandlesForPlatforms(userId, selectedPlatforms);

    if (!handles.length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "No connected social handles available for selected accounts/platforms",
      );
    }
    // Fan-out publish: one post can target multiple connected handles across platforms.
    const responseItems = [];
    for (const handle of handles) {
      const adapter = getPublishAdapter(handle.platform);
      if (!adapter) {
        responseItems.push({
          platform: handle.platform,
          status: "failed",
          message: "Publish adapter not available",
          raw: {},
        });
        continue;
      }
      const result = await adapter.publish(post, handle);
      let resultMessage = (result as any).message || "";

      if (isRevokedLinkedInToken(handle.platform, result)) {
        await socialHandleRepository.updateByIdAndUserId(handle._id, userId, {
          isConnected: false,
          platformAccessToken: "",
          platformRefreshToken: "",
          platformAccessTokenExpiry: null,
        });

        await notificationService.createNotification({
          userId,
          type: notificationTypes.TOKEN_EXPIRED,
          title: "LinkedIn re-authentication required",
          message:
            "Your LinkedIn session was revoked. Reconnect LinkedIn from the Accounts page.",
          metadata: { platform: handle.platform, socialHandleId: handle._id },
        });

        resultMessage =
          "LinkedIn access was revoked. Reconnect LinkedIn from Accounts, then publish again.";
      }

      responseItems.push({
        platform: handle.platform,
        platformPostId: (result as any).platformPostId || "",
        url: (result as any).url || "",
        status: (result as any).status,
        message: resultMessage,
        raw: (result as any).raw || {},
      });
    }
    // A partial success still marks the post as published with per-platform response tracking.
    const successCount = responseItems.filter(
      (item) => item.status === "success",
    ).length;
    const nextStatus =
      successCount > 0 ? postStatus.PUBLISHED : postStatus.FAILED;
    const updated = await postRepository.updateByIdAndUserId(postId, userId, {
      platformResponses: responseItems,
      publishedTime: new Date(),
      status: nextStatus,
    });
    await notificationService.createNotification({
      userId,
      type:
        nextStatus === postStatus.PUBLISHED
          ? notificationTypes.POST_PUBLISHED
          : notificationTypes.POST_FAILED,
      title:
        nextStatus === postStatus.PUBLISHED
          ? "Post published"
          : "Post publish failed",
      message:
        nextStatus === postStatus.PUBLISHED
          ? "Your post was published to one or more platforms"
          : "Your post could not be published to selected platforms",
      metadata: {
        postId: updated._id,
        successCount,
        totalPlatforms: responseItems.length,
      },
    });
    return updated;
  }
  async schedulePost(userId, postId, scheduledTime, timezone) {
    const post = await this.getPost(userId, postId);
    if (new Date(scheduledTime).getTime() <= Date.now()) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Scheduled time must be in the future",
      );
    }
    const updated = await postRepository.updateByIdAndUserId(post._id, userId, {
      scheduledTime,
      timezone: timezone || post.timezone,
      status: postStatus.SCHEDULED,
    });
    // Queue-driven scheduling enables reliable delayed execution and retries.
    await addSchedulePublishJob({
      postId: updated._id.toString(),
      runAt: scheduledTime,
    });
    return updated;
  }
  async publishScheduledPost(postId) {
    const post = await postRepository.findById(postId);
    if (!post) return;
    await this.publishPost(
      post.userId.toString(),
      post._id.toString(),
      post.selectedPlatforms,
      post.selectedAccountIds || [],
    );
    await notificationService.createNotification({
      userId: post.userId,
      type: notificationTypes.SCHEDULED_POST_PUBLISHED,
      title: "Scheduled post published",
      message: "A scheduled post was published automatically",
      metadata: { postId: post._id },
    });
  }
  countPosts(userId) {
    return postRepository.countByUserId(userId);
  }
  async statusBreakdown(userId) {
    const rows = await postRepository.aggregateDashboard(
      new mongoose.Types.ObjectId(userId),
    );
    const map = { draft: 0, scheduled: 0, published: 0, failed: 0 };
    for (const row of rows) {
      map[row._id] = row.count;
    }
    return map;
  }
  async platformBreakdown(userId) {
    const rows = await postRepository.platformStats(
      new mongoose.Types.ObjectId(userId),
    );
    return rows.map((row) => ({ platform: row._id, count: row.count }));
  }
}
export default new PostService();
