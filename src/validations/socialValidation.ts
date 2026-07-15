import Joi from "joi";

const validPlatforms = ["facebook", "instagram", "linkedin", "x"];

const connect = Joi.object({
  body: Joi.object({}).required(),
  params: Joi.object({
    platform: Joi.string()
      .valid(...validPlatforms)
      .required(),
  }).required(),
  query: Joi.object({}).required(),
});

const callback = Joi.object({
  body: Joi.object({}).optional(),
  params: Joi.object({
    platform: Joi.string()
      .valid(...validPlatforms)
      .required(),
  }).required(),
  query: Joi.object({
    code: Joi.string().required(),
    state: Joi.string().optional(),
    userId: Joi.string().optional(),
  }).required(),
});

const refreshToken = Joi.object({
  body: Joi.object({ socialId: Joi.string().required() }).required(),
  params: Joi.object({}).required(),
  query: Joi.object({}).required(),
});

const remove = Joi.object({
  body: Joi.object({}).required(),
  params: Joi.object({ id: Joi.string().required() }).required(),
  query: Joi.object({}).required(),
});

export { connect, callback, refreshToken, remove };

export default { connect, callback, refreshToken, remove };
