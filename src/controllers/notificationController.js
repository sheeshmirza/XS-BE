const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const httpStatus = require('../constants/httpStatus');
const notificationService = require('../services/notificationService');
const { parsePagination } = require('../utils/pagination');

const listNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const sort = { [req.query.sortBy || 'createdAt']: req.query.order === 'asc' ? 1 : -1 };

  const filters = {};
  if (req.query.type) filters.type = req.query.type;
  if (req.query.isRead !== undefined) filters.isRead = req.query.isRead === 'true';

  const result = await notificationService.listNotifications(req.user._id, filters, { skip, limit, sort });

  return sendSuccess(res, httpStatus.OK, 'Notifications fetched', result.items, {
    page,
    limit,
    total: result.total
  });
});

module.exports = { listNotifications };
