import asyncHandler from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";
import httpStatus from "../constants/httpStatus";
import socialService from "../services/socialService";
import { parsePagination } from "../utils/pagination";
const listAccounts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const sort = {
    [req.query.sortBy || "createdAt"]: req.query.order === "asc" ? 1 : -1,
  };
  const result = await socialService.listAccounts(
    req.user._id,
    {
      platform: req.query.platform,
      isConnected:
        req.query.isConnected === undefined
          ? undefined
          : req.query.isConnected === "true",
    },
    { skip, limit, sort },
  );
  return sendSuccess(
    res,
    httpStatus.OK,
    "Social accounts fetched",
    result.items,
    { page, limit, total: result.total },
  );
});
const connectPlatform = asyncHandler(async (req, res) => {
  const authUrl = socialService.getConnectUrl(
    req.user._id.toString(),
    req.params.platform,
  );
  return sendSuccess(res, httpStatus.OK, "OAuth URL generated", { authUrl });
});
const oauthCallback = asyncHandler(async (req, res) => {
  const userId = req.query.state?.split(":")[0] || req.query.userId;
  const socialHandle = await socialService.connectFromCallback(
    userId,
    req.params.platform,
    req.query.code,
  );
  return sendSuccess(
    res,
    httpStatus.OK,
    "Social account connected",
    socialHandle,
  );
});
const disconnect = asyncHandler(async (req, res) => {
  await socialService.disconnectAccount(req.user._id, req.params.id);
  return sendSuccess(res, httpStatus.OK, "Social account disconnected");
});
const refreshSocialToken = asyncHandler(async (req, res) => {
  const socialHandle = await socialService.refreshPlatformToken(
    req.user._id,
    req.body.socialId,
  );
  return sendSuccess(
    res,
    httpStatus.OK,
    "Social token refreshed",
    socialHandle,
  );
});
export {
  listAccounts,
  connectPlatform,
  oauthCallback,
  disconnect,
  refreshSocialToken,
};
export default {
  listAccounts,
  connectPlatform,
  oauthCallback,
  disconnect,
  refreshSocialToken,
};
