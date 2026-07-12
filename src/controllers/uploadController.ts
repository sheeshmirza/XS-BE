import asyncHandler from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";
import httpStatus from "../constants/httpStatus";
import ApiError from "../utils/ApiError";

const uploadMedia = asyncHandler(async (req: any, res: any) => {
  throw new ApiError(
    httpStatus.NOT_FOUND,
    "File upload functionality is not available. This service supports text-only posts.",
  );
});

export { uploadMedia };
export default { uploadMedia };
