const express = require('express');
const dashboardController = require('../../controllers/dashboardController');
const auth = require('../../middleware/auth');

const router = express.Router();

router.get('/stats', auth, dashboardController.getStats);

module.exports = router;
