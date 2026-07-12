import asyncHandler from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";
import httpStatus from "../constants/httpStatus";
import notificationService from "../services/notificationService";
import { parsePagination } from "../utils/pagination";
const listNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const sort = {
    [req.query.sortBy || "createdAt"]: req.query.order === "asc" ? 1 : -1,
  };
  const filters: any = {};
  if (req.query.type) filters.type = req.query.type;
  if (req.query.isRead !== undefined)
    filters.isRead = req.query.isRead === "true";
  const result = await notificationService.listNotifications(
    req.user._id,
    filters,
    { skip, limit, sort },
  );
  return sendSuccess(
    res,
    httpStatus.OK,
    "Notifications fetched",
    result.items,
    { page, limit, total: result.total },
  );
});
export { listNotifications };
export default { listNotifications };
