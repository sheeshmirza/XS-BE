const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const httpStatus = require('../constants/httpStatus');
const dashboardService = require('../services/dashboardService');

const getStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getStats(req.user._id.toString());
  return sendSuccess(res, httpStatus.OK, 'Dashboard stats fetched', stats);
});

module.exports = { getStats };
