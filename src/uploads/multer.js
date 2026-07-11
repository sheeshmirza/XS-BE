const multer = require('multer');
const ApiError = require('../utils/ApiError');
const httpStatus = require('../constants/httpStatus');

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (/^(image|video)\//.test(file.mimetype)) {
    return cb(null, true);
  }
  return cb(new ApiError(httpStatus.BAD_REQUEST, 'Only image/video/gif files are allowed'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 30 * 1024 * 1024 } });

module.exports = upload;
