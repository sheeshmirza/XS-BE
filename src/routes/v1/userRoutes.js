const express = require('express');
const userController = require('../../controllers/userController');
const auth = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const userValidation = require('../../validations/userValidation');

const router = express.Router();

router.get('/me', auth, userController.getMe);
router.put('/me', auth, validate(userValidation.updateMe), userController.updateMe);
router.put('/me/change-password', auth, validate(userValidation.changePassword), userController.changePassword);
router.delete('/me', auth, userController.deleteMe);

module.exports = router;
