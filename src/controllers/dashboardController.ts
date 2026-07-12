import asyncHandler from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import httpStatus from '../constants/httpStatus';
import dashboardService from '../services/dashboardService';
const getStats = asyncHandler(async (req, res) => { const stats = await dashboardService.getStats(req.user._id.toString());
  return sendSuccess(res, httpStatus.OK, 'Dashboard stats fetched', stats); });
export { getStats };
export default { getStats };
