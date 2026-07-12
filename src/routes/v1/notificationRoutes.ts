import express from 'express';
import notificationController from '../../controllers/notificationController';
import auth from '../../middleware/auth';
import validate from '../../middleware/validate';
import notificationValidation from '../../validations/notificationValidation';
const router = express.Router();
router.get('/', auth, validate(notificationValidation.listNotifications), notificationController.listNotifications);
export default router;
