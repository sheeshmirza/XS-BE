//Reviewed

import httpStatus from "../constants/httpStatus";
import ApiError from "../utils/ApiError";

const validate = (schema) => (req, _res, next) => {
  const payload = {
    body: req.body || {},
    params: req.params || {},
    query: req.query || {},
  };
  const { error, value } = schema.validate(payload, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
  });
  if (error) {
    return next(
      new ApiError(
        httpStatus.BAD_REQUEST,
        "Validation failed",
        error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message,
        })),
      ),
    );
  }
  if (req.body && typeof req.body === "object") {
    Object.keys(req.body).forEach((key) => {
      delete req.body[key];
    });
    Object.assign(req.body, value.body || {});
  }
  if (req.params && typeof req.params === "object") {
    Object.keys(req.params).forEach((key) => {
      delete req.params[key];
    });
    Object.assign(req.params, value.params || {});
  }
  if (req.query && typeof req.query === "object") {
    Object.keys(req.query).forEach((key) => {
      delete req.query[key];
    });
    Object.assign(req.query, value.query || {});
  }
  next();
};

export default validate;
