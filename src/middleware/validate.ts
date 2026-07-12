import ApiError from "../utils/ApiError";
import httpStatus from "../constants/httpStatus";
const validate = (schema) => (req, _res, next) => {
  const payload = { body: req.body, params: req.params, query: req.query };
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
  req.body = value.body || {};
  req.params = value.params || {};
  req.query = value.query || {};
  next();
};
export default validate;
