import Joi from "joi";
const platforms = ["linkedin", "instagram", "facebook", "x"];
const recurrenceValues = [
  "once",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
];
const mediaSchema = Joi.object({
  type: Joi.string().valid("image", "video", "gif").required(),
  url: Joi.string().uri().required(),
  mimeType: Joi.string().optional(),
  size: Joi.number().min(0).optional(),
});
const createPost = Joi.object({
  body: Joi.object({
    title: Joi.string().max(140).allow("").optional(),
    caption: Joi.string().required(),
    hashtags: Joi.array().items(Joi.string()).optional(),
    mentions: Joi.array().items(Joi.string()).optional(),
    media: Joi.array().items(mediaSchema).optional(),
    postType: Joi.string()
      .valid("text", "image", "video", "gif", "mixed")
      .default("text"),
    visibility: Joi.string().valid("public", "private").default("public"),
    timezone: Joi.string().optional(),
    selectedPlatforms: Joi.array()
      .items(Joi.string().valid(...platforms))
      .optional(),
    selectedAccountIds: Joi.array().items(Joi.string()).optional(),
    scheduledTime: Joi.date().iso().optional(),
    recurrence: Joi.string()
      .valid(...recurrenceValues)
      .optional(),
    status: Joi.string().valid("draft", "scheduled").optional(),
  }).required(),
  params: Joi.object({}).required(),
  query: Joi.object({}).required(),
});
const listPosts = Joi.object({
  body: Joi.object({}).required(),
  params: Joi.object({}).required(),
  query: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    status: Joi.string()
      .valid("draft", "scheduled", "published", "failed")
      .optional(),
    postType: Joi.string()
      .valid("text", "image", "video", "gif", "mixed")
      .optional(),
    search: Joi.string().optional(),
    sortBy: Joi.string()
      .valid("createdAt", "updatedAt", "scheduledTime")
      .optional(),
    order: Joi.string().valid("asc", "desc").optional(),
  }).required(),
});
const postIdParam = Joi.object({
  body: Joi.object({}).required(),
  params: Joi.object({ id: Joi.string().required() }).required(),
  query: Joi.object({}).required(),
});
const updatePost = Joi.object({
  body: Joi.object({
    title: Joi.string().max(140).allow("").optional(),
    caption: Joi.string().optional(),
    hashtags: Joi.array().items(Joi.string()).optional(),
    mentions: Joi.array().items(Joi.string()).optional(),
    media: Joi.array().items(mediaSchema).optional(),
    postType: Joi.string()
      .valid("text", "image", "video", "gif", "mixed")
      .optional(),
    visibility: Joi.string().valid("public", "private").optional(),
    timezone: Joi.string().optional(),
    selectedPlatforms: Joi.array()
      .items(Joi.string().valid(...platforms))
      .optional(),
    selectedAccountIds: Joi.array().items(Joi.string()).optional(),
    recurrence: Joi.string()
      .valid(...recurrenceValues)
      .optional(),
    status: Joi.string()
      .valid("draft", "scheduled", "published", "failed")
      .optional(),
  }).required(),
  params: Joi.object({ id: Joi.string().required() }).required(),
  query: Joi.object({}).required(),
});
const publishPost = Joi.object({
  body: Joi.object({
    platforms: Joi.array()
      .items(Joi.string().valid(...platforms))
      .optional(),
    accountIds: Joi.array().items(Joi.string()).optional(),
    recurrence: Joi.string()
      .valid(...recurrenceValues)
      .optional(),
  }).required(),
  params: Joi.object({ id: Joi.string().required() }).required(),
  query: Joi.object({}).required(),
});
const schedulePost = Joi.object({
  body: Joi.object({
    scheduledTime: Joi.date().iso().optional(),
    date: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    time: Joi.string()
      .pattern(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
      .optional(),
    timezone: Joi.string().optional(),
    recurrence: Joi.string()
      .valid(...recurrenceValues)
      .optional(),
  })
    .or("scheduledTime", "date")
    .with("date", "time")
    .required(),
  params: Joi.object({ id: Joi.string().required() }).required(),
  query: Joi.object({}).required(),
});
export {
  createPost,
  listPosts,
  postIdParam,
  updatePost,
  publishPost,
  schedulePost,
};
export default {
  createPost,
  listPosts,
  postIdParam,
  updatePost,
  publishPost,
  schedulePost,
};
