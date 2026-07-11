const Joi = require('joi');

const email = Joi.string().email().required();
const password = Joi.string().min(8).max(128).required();

const signup = Joi.object({
  body: Joi.object({
    email,
    password
  }).required(),
  params: Joi.object({}).required(),
  query: Joi.object({}).required()
});

const login = Joi.object({
  body: Joi.object({
    email,
    password
  }).required(),
  params: Joi.object({}).required(),
  query: Joi.object({}).required()
});

const refresh = Joi.object({
  body: Joi.object({
    refreshToken: Joi.string().required()
  }).required(),
  params: Joi.object({}).required(),
  query: Joi.object({}).required()
});

const logout = Joi.object({
  body: Joi.object({
    refreshToken: Joi.string().optional()
  }).required(),
  params: Joi.object({}).required(),
  query: Joi.object({}).required()
});

const forgotPassword = Joi.object({
  body: Joi.object({ email }).required(),
  params: Joi.object({}).required(),
  query: Joi.object({}).required()
});

const resetPassword = Joi.object({
  body: Joi.object({
    token: Joi.string().required(),
    newPassword: password
  }).required(),
  params: Joi.object({}).required(),
  query: Joi.object({}).required()
});

const verifyEmail = Joi.object({
  body: Joi.object({ token: Joi.string().required() }).required(),
  params: Joi.object({}).required(),
  query: Joi.object({}).required()
});

module.exports = {
  signup,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail
};
