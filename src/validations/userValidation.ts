import Joi from 'joi';
const updateMe = Joi.object({ body: Joi.object({ fullName: Joi.string().max(120).optional(),
    avatarUrl: Joi.string().uri().optional(),
    timezone: Joi.string().max(60).optional() }).required(),
  params: Joi.object({}).required(),
  query: Joi.object({}).required() });
const changePassword = Joi.object({ body: Joi.object({ oldPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).max(128).required() }).required(),
  params: Joi.object({}).required(),
  query: Joi.object({}).required() });
export { updateMe, changePassword };
export default { updateMe, changePassword };
