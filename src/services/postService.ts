import mongoose from "mongoose";
import postRepository from "../repositories/postRepository";
import notificationService from "./notificationService";
import postStatus from "../constants/postStatus";
import notificationTypes from "../constants/notificationTypes";
import ApiError from "../utils/ApiError";
import httpStatus from "../constants/httpStatus";
import {
  addSchedulePublishJob,
  removeSchedulePublishJob,
} from "../queue/postQueue";
import aiService from "./aiService";
import postPublishService from "./postPublish";
class PostService {
  private validateInstagramContentRequirements(
    platformList: any[] = [],
    mediaList: any[] = [],
  ) {
    const normalizedPlatforms = Array.isArray(platformList)
      ? platformList.map((platform) => String(platform || "").trim().toLowerCase())
      : [];
    const includesInstagram = normalizedPlatforms.includes("instagram");
    const hasMedia = Array.isArray(mediaList)
      ? mediaList.some((item) => String(item?.url || "").trim())
      : false;

    if (includesInstagram && !hasMedia) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Instagram publishing requires at least one media item",
      );
    }
  }

  private normalizeGenerationType(value: any) {
    const normalized = String(value || "")
      .trim()
      .toLowerCase();
    if (["text", "image", "both"].includes(normalized)) {
      return normalized;
    }
    return "text";
  }

  private async resolveAiGeneratedContent(payload: any) {
    const ai = payload?.ai;
    if (!ai?.enabled) {
      return payload;
    }

    let generationType = this.normalizeGenerationType(ai.generationType);
    if (!ai.generationType) {
      const hasTextSignal = Boolean(ai.textPrompt || ai.prompt);
      const hasImageSignal = Boolean(ai.generateImage || ai.imagePrompt);
      if (hasTextSignal && hasImageSignal) {
        generationType = "both";
      } else if (hasImageSignal) {
        generationType = "image";
      } else {
        generationType = "text";
      }
    }
    const shouldGenerateText =
      generationType === "text" || generationType === "both";
    const shouldGenerateImage =
      generationType === "image" ||
      generationType === "both" ||
      ai.generateImage === true;

    const textProvider = String(ai.textProvider || ai.provider || "").trim();
    const textModel = String(ai.textModel || ai.model || "").trim();
    const textPrompt = String(ai.textPrompt || ai.prompt || "").trim();

    let generatedCaption = "";
    if (shouldGenerateText) {
      if (!textProvider || !textModel || !textPrompt) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "AI text generation requires provider, model, and text prompt",
        );
      }

      const textResponse: any = await aiService.generateText({
        provider: textProvider,
        model: textModel,
        prompt: textPrompt,
        system_prompt: ai.systemPrompt,
        max_tokens: ai.maxTokens,
        temperature: ai.temperature,
        stream: false,
      });

      generatedCaption = String(textResponse?.text || "").trim();
      if (!generatedCaption && !String(payload.caption || "").trim()) {
        throw new ApiError(
          httpStatus.BAD_GATEWAY,
          "AI text generation returned empty text",
        );
      }
    }

    const mergedMedia = Array.isArray(payload.media) ? [...payload.media] : [];
    const initialMediaCount = mergedMedia.length;

    if (shouldGenerateImage) {
      const imageProvider = String(
        ai.imageProvider || textProvider || ai.provider || "",
      ).trim();
      const imageModel = String(ai.imageModel || "").trim();
      const imagePrompt = String(
        ai.imagePrompt || textPrompt || ai.prompt || "",
      ).trim();

      if (!imageProvider || !imageModel || !imagePrompt) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "AI image generation requires image provider, image model, and image prompt",
        );
      }

      const imageResponse: any = await aiService.generateImage({
        provider: imageProvider,
        model: imageModel,
        prompt: imagePrompt,
        size: ai.imageSize,
        count: ai.imageCount,
        quality: ai.imageQuality,
        format: ai.imageFormat,
      });

      const generatedImages = Array.isArray(imageResponse?.images)
        ? imageResponse.images
        : [];

      for (const image of generatedImages) {
        if (image?.url) {
          mergedMedia.push({
            type: "image",
            url: image.url,
            mimeType: image.mime_type || image.mimeType || "",
            size: 0,
          });
        }
      }

      if (mergedMedia.length === initialMediaCount) {
        throw new ApiError(
          httpStatus.BAD_GATEWAY,
          "AI image generation did not return image URLs",
        );
      }
    }

    const finalCaption =
      String(payload.caption || "").trim() || generatedCaption;
    const hasMedia = mergedMedia.length > 0;

    if (!finalCaption && !hasMedia) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Provide caption or enable AI generation for text/image content",
      );
    }

    const inferredPostType =
      hasMedia && finalCaption ? "mixed" : hasMedia ? "image" : "text";

    return {
      ...payload,
      caption: finalCaption,
      media: mergedMedia,
      postType: payload.postType || inferredPostType,
    };
  }

  private getRecurrenceValue(value: string) {
    const allowed = new Set([
      "once",
      "hourly",
      "daily",
      "weekly",
      "monthly",
      "yearly",
    ]);
    const normalized = String(value || "once")
      .trim()
      .toLowerCase();
    return allowed.has(normalized) ? normalized : "once";
  }

  private computeNextRun(currentRunAt: Date, recurrence: string) {
    const next = new Date(currentRunAt);
    switch (recurrence) {
      case "hourly":
        next.setHours(next.getHours() + 1);
        break;
      case "daily":
        next.setDate(next.getDate() + 1);
        break;
      case "weekly":
        next.setDate(next.getDate() + 7);
        break;
      case "monthly":
        next.setMonth(next.getMonth() + 1);
        break;
      case "yearly":
        next.setFullYear(next.getFullYear() + 1);
        break;
      default:
        return null;
    }
    return next;
  }

  private resolveDateTimeInTimezone(
    date: string,
    time: string,
    timezone: string,
  ): Date {
    const match = time.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!match) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Invalid time format. Expected HH:mm or HH:mm:ss",
      );
    }
    const [yearStr, monthStr, dayStr] = date.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    const second = Number(match[3] || "0");
    const desiredLocalMs = Date.UTC(year, month - 1, day, hour, minute, second);
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const resolveOffsetMs = (utcMs: number) => {
      const parts = formatter.formatToParts(new Date(utcMs));
      const map = Object.fromEntries(
        parts.map((part) => [part.type, part.value]),
      );
      const zonedAsUtcMs = Date.UTC(
        Number(map.year),
        Number(map.month) - 1,
        Number(map.day),
        Number(map.hour),
        Number(map.minute),
        Number(map.second),
      );
      return zonedAsUtcMs - utcMs;
    };
    const firstGuessMs = desiredLocalMs;
    const firstOffsetMs = resolveOffsetMs(firstGuessMs);
    const secondGuessMs = desiredLocalMs - firstOffsetMs;
    const secondOffsetMs = resolveOffsetMs(secondGuessMs);
    const finalUtcMs = desiredLocalMs - secondOffsetMs;
    return new Date(finalUtcMs);
  }

  private resolveScheduledDateTime(scheduleInput: any) {
    const scheduledTime = scheduleInput?.scheduledTime;
    const date = String(scheduleInput?.date || "").trim();
    const time = String(scheduleInput?.time || "").trim();
    const timezone = String(scheduleInput?.timezone || "UTC").trim();
    if (scheduledTime) {
      const resolved = new Date(scheduledTime);
      if (Number.isNaN(resolved.getTime())) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Invalid scheduledTime value",
        );
      }
      return resolved;
    }
    if (!date || !time) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Provide scheduledTime or both date and time",
      );
    }
    let resolved: Date;
    try {
      resolved = this.resolveDateTimeInTimezone(date, time, timezone);
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Invalid timezone value for scheduling",
      );
    }
    if (Number.isNaN(resolved.getTime())) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Invalid date/time values for scheduling",
      );
    }

    return resolved;
  }

  async createPost(userId, payload) {
    const resolvedPayload = await this.resolveAiGeneratedContent(payload);

    if (
      !String(resolvedPayload.caption || "").trim() &&
      !(Array.isArray(resolvedPayload.media) && resolvedPayload.media.length)
    ) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "caption or media is required",
      );
    }

    this.validateInstagramContentRequirements(
      resolvedPayload.selectedPlatforms,
      resolvedPayload.media,
    );

    return postRepository.create({
      userId,
      title: resolvedPayload.title,
      caption: resolvedPayload.caption,
      hashtags: resolvedPayload.hashtags || [],
      mentions: resolvedPayload.mentions || [],
      media: resolvedPayload.media || [],
      postType: resolvedPayload.postType,
      visibility: resolvedPayload.visibility,
      timezone: resolvedPayload.timezone || "UTC",
      scheduledTime: resolvedPayload.scheduledTime || null,
      recurrence: this.getRecurrenceValue(resolvedPayload.recurrence),
      status: resolvedPayload.status || postStatus.DRAFT,
      selectedPlatforms: resolvedPayload.selectedPlatforms || [],
      selectedAccountIds: resolvedPayload.selectedAccountIds || [],
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
    if (
      Object.prototype.hasOwnProperty.call(payload || {}, "selectedPlatforms") ||
      Object.prototype.hasOwnProperty.call(payload || {}, "media")
    ) {
      const existingPost = await this.getPost(userId, postId);
      const nextPlatforms = Object.prototype.hasOwnProperty.call(
        payload || {},
        "selectedPlatforms",
      )
        ? payload.selectedPlatforms
        : existingPost.selectedPlatforms;
      const nextMedia = Object.prototype.hasOwnProperty.call(payload || {}, "media")
        ? payload.media
        : existingPost.media;

      this.validateInstagramContentRequirements(nextPlatforms, nextMedia);
    }

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
    await removeSchedulePublishJob(postId);
    const deleted = await postRepository.deleteByIdAndUserId(postId, userId);
    if (!deleted) {
      throw new ApiError(httpStatus.NOT_FOUND, "Post not found");
    }
    return deleted;
  }

  async publishPost(
    userId,
    postId,
    platformList = [],
    accountIdList = [],
    recurrenceInput?: string,
  ) {
    const post = await this.getPost(userId, postId);
    const selectedPlatforms =
      platformList.length > 0 ? platformList : post.selectedPlatforms;
    const selectedAccountIds =
      accountIdList.length > 0 ? accountIdList : post.selectedAccountIds || [];

    this.validateInstagramContentRequirements(selectedPlatforms, post.media);

    const responseItems = await postPublishService.publishToPlatforms({
      userId,
      post,
      selectedPlatforms,
      selectedAccountIds,
    });
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
      recurrence:
        recurrenceInput !== undefined
          ? this.getRecurrenceValue(recurrenceInput)
          : post.recurrence,
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

    const normalizedRecurrence = this.getRecurrenceValue(
      recurrenceInput || "once",
    );
    if (
      nextStatus === postStatus.PUBLISHED &&
      normalizedRecurrence !== "once"
    ) {
      const baseRunAt = new Date();
      const nextRunAt = this.computeNextRun(baseRunAt, normalizedRecurrence);

      if (nextRunAt && !Number.isNaN(nextRunAt.getTime())) {
        const recurrentPost = await postRepository.updateByIdAndUserId(
          postId,
          userId,
          {
            scheduledTime: nextRunAt,
            recurrence: normalizedRecurrence,
            status: postStatus.SCHEDULED,
          },
        );

        await addSchedulePublishJob({
          postId: recurrentPost._id.toString(),
          runAt: nextRunAt,
        });

        return recurrentPost;
      }
    }

    return updated;
  }
  async schedulePost(userId, postId, scheduleInput: any) {
    const post = await this.getPost(userId, postId);
    this.validateInstagramContentRequirements(post.selectedPlatforms, post.media);
    const resolvedScheduledTime = this.resolveScheduledDateTime(scheduleInput);

    if (resolvedScheduledTime.getTime() <= Date.now()) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Scheduled time must be in the future",
      );
    }
    const updated = await postRepository.updateByIdAndUserId(post._id, userId, {
      scheduledTime: resolvedScheduledTime,
      timezone: scheduleInput?.timezone || post.timezone,
      recurrence: this.getRecurrenceValue(scheduleInput?.recurrence),
      status: postStatus.SCHEDULED,
    });
    // Queue-driven scheduling enables reliable delayed execution and retries.
    await addSchedulePublishJob({
      postId: updated._id.toString(),
      runAt: resolvedScheduledTime,
    });
    return updated;
  }
  async publishScheduledPost(postId) {
    const post = await postRepository.findById(postId);
    if (!post) return;
    const publishedPost: any = await this.publishPost(
      post.userId.toString(),
      post._id.toString(),
      post.selectedPlatforms,
      post.selectedAccountIds || [],
    );

    const recurrence = this.getRecurrenceValue(post?.recurrence);
    if (
      publishedPost?.status === postStatus.PUBLISHED &&
      recurrence !== "once"
    ) {
      const baseRunAt = post?.scheduledTime
        ? new Date(post.scheduledTime)
        : new Date();
      const nextRunAt = this.computeNextRun(baseRunAt, recurrence);

      if (nextRunAt && !Number.isNaN(nextRunAt.getTime())) {
        await postRepository.updateByIdAndUserId(post._id, post.userId, {
          scheduledTime: nextRunAt,
          status: postStatus.SCHEDULED,
        });
        await addSchedulePublishJob({
          postId: post._id.toString(),
          runAt: nextRunAt,
        });
      }
    }

    await notificationService.createNotification({
      userId: post.userId,
      type: notificationTypes.SCHEDULED_POST_PUBLISHED,
      title: "Scheduled post published",
      message: "A scheduled post was published automatically",
      metadata: { postId: post._id },
    });
  }
  async requeueRecurringScheduledPostsOnStartup() {
    const posts = await postRepository.listRecurringScheduledPosts();
    if (!posts.length) {
      return;
    }

    let restoredCount = 0;
    for (const post of posts) {
      const scheduledTime = post?.scheduledTime
        ? new Date(post.scheduledTime)
        : null;
      if (!scheduledTime || Number.isNaN(scheduledTime.getTime())) {
        continue;
      }

      try {
        await addSchedulePublishJob({
          postId: post._id.toString(),
          runAt: scheduledTime,
        });
        restoredCount += 1;
      } catch (error: any) {
        console.error({
          message: "Failed to restore recurring scheduled post job",
          postId: post?._id?.toString?.() || "",
          error: error?.message || String(error),
        });
      }
    }

    console.log({
      message: "Recurring scheduled post jobs restored",
      restoredCount,
      totalCandidates: posts.length,
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
