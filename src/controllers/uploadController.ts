import asyncHandler from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";
import httpStatus from "../constants/httpStatus";
import ApiError from "../utils/ApiError";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import env from "../config/env";

const uploadMedia = asyncHandler(async (req: any, res: any) => {
  const files = Array.isArray(req.files) ? req.files : [];

  if (!files.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No files were uploaded");
  }

  const uploadDir = path.resolve(process.cwd(), "uploads");
  fs.mkdirSync(uploadDir, { recursive: true });

  const baseUrl = String(env.clientUrl || `${req.protocol}://${req.get("host")}`)
    .trim()
    .replace(/\/$/, "");

  const uploadedFiles = files.map((file) => {
    const extension = path.extname(file.originalname || "");
    const safeExtension = extension ? extension.toLowerCase() : "";
    const fileName = `${Date.now()}-${randomUUID()}${safeExtension}`;
    const absolutePath = path.join(uploadDir, fileName);

    fs.writeFileSync(absolutePath, file.buffer);

    return {
      name: file.originalname,
      mimeType: file.mimetype,
      size: Number(file.size || 0),
      url: `${baseUrl}/uploads/${fileName}`,
    };
  });

  return sendSuccess(
    res,
    httpStatus.CREATED,
    "Files uploaded successfully",
    uploadedFiles,
  );
});

export { uploadMedia };
export default { uploadMedia };
