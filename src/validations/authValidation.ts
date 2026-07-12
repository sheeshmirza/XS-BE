//Reviewed

import Joi from "joi";

const email = Joi.string().email().required();

const password = Joi.string().required();

const emptyParams = Joi.object({}).required();
const emptyQuery = Joi.object({}).required();

const signup = Joi.object({
  body: Joi.object({
    email,
    password,
  }).required(),
  params: emptyParams,
  query: emptyQuery,
});

const verifyEmail = Joi.object({
  body: Joi.object({
    token: Joi.string().required(),
  }).required(),
  params: emptyParams,
  query: emptyQuery,
});

const login = Joi.object({
  body: Joi.object({
    email,
    password,
  }).required(),
  params: emptyParams,
  query: emptyQuery,
});

const refresh = Joi.object({
  body: Joi.object({
    refreshToken: Joi.string().required(),
  }).required(),
  params: emptyParams,
  query: emptyQuery,
});

const logout = Joi.object({
  body: Joi.object({
    refreshToken: Joi.string().optional(),
  }).required(),
  params: emptyParams,
  query: emptyQuery,
});

const forgotPassword = Joi.object({
  body: Joi.object({
    email,
  }).required(),
  params: emptyParams,
  query: emptyQuery,
});

const resetPassword = Joi.object({
  body: Joi.object({
    token: Joi.string().required(),
    newPassword: password,
  }).required(),
  params: emptyParams,
  query: emptyQuery,
});

export {
  signup,
  verifyEmail,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
};

export default {
  signup,
  verifyEmail,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
};
