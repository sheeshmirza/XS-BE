import Joi from 'joi';
const listNotifications = Joi.object({ body: Joi.object({}).required(),
  params: Joi.object({}).required(),
  query: Joi.object({ page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    type: Joi.string()
      .valid('social_connected', 'token_expired', 'post_published', 'post_failed', 'scheduled_post_published')
      .optional(),
    isRead: Joi.boolean().optional(),
    sortBy: Joi.string().valid('createdAt', 'updatedAt').optional(),
    order: Joi.string().valid('asc', 'desc').optional() }).required() });
export { listNotifications };
export default { listNotifications };
