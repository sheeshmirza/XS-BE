const express = require('express');
const notificationController = require('../../controllers/notificationController');
const auth = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const notificationValidation = require('../../validations/notificationValidation');

const router = express.Router();

router.get('/', auth, validate(notificationValidation.listNotifications), notificationController.listNotifications);

module.exports = router;
