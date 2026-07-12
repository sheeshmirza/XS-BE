import express from 'express';
import auth from '../../middleware/auth';
import upload from '../../uploads/multer';
import uploadController from '../../controllers/uploadController';
const router = express.Router();
router.post('/media', auth, upload.array('files', 10), uploadController.uploadMedia);
export default router;
