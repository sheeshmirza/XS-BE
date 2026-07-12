import asyncHandler from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import httpStatus from '../constants/httpStatus';
import ApiError from '../utils/ApiError';
import cloudinary from '../config/cloudinary';
const uploadToCloudinary = (buffer, mimeType, originalname) =>
  new Promise((resolve, reject) => { const resourceType = mimeType.startsWith('video/') ? 'video' : 'image';
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'xsocial',
        resource_type: resourceType,
        public_id: `${Date.now()}-${originalname.replace(/\s+/g, '-')}` },
      (error, result) => { if (error) return reject(error);
        return resolve(result); }
    );
    stream.end(buffer); });
const uploadMedia = asyncHandler(async (req, res) => { if (!req.files || !req.files.length) { throw new ApiError(httpStatus.BAD_REQUEST, 'No files uploaded'); }
  const hasCloudinaryConfig = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
  );
  if (!hasCloudinaryConfig) { throw new ApiError(httpStatus.BAD_REQUEST, 'Cloudinary is not configured in environment variables'); }
  const media = [];
  for (const file of req.files) { const result = await uploadToCloudinary(file.buffer, file.mimetype, file.originalname);
    media.push({ type: file.mimetype.startsWith('video/') ? 'video' : file.mimetype === 'image/gif' ? 'gif' : 'image',
      url: result.secure_url,
      mimeType: file.mimetype,
      size: file.size }); }
  return sendSuccess(res, httpStatus.CREATED, 'Files uploaded successfully', media); });
export { uploadMedia };
