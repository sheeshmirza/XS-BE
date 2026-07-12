import express from 'express';
import dashboardController from '../../controllers/dashboardController';
import auth from '../../middleware/auth';
const router = express.Router();
router.get('/stats', auth, dashboardController.getStats);
export default router;
