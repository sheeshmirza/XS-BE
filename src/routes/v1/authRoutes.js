const express = require('express');
const authController = require('../../controllers/authController');
const validate = require('../../middleware/validate');
const authValidation = require('../../validations/authValidation');
const auth = require('../../middleware/auth');

const router = express.Router();

router.post('/signup', validate(authValidation.signup), authController.signup);
router.post('/verify-email', validate(authValidation.verifyEmail), authController.verifyEmail);
router.post('/login', validate(authValidation.login), authController.login);
router.post('/refresh', validate(authValidation.refresh), authController.refresh);
router.post('/logout', auth, validate(authValidation.logout), authController.logout);
router.post('/forgot-password', validate(authValidation.forgotPassword), authController.forgotPassword);
router.post('/reset-password', validate(authValidation.resetPassword), authController.resetPassword);

module.exports = router;
