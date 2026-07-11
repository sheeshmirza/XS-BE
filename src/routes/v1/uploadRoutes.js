const express = require('express');
const auth = require('../../middleware/auth');
const upload = require('../../uploads/multer');
const uploadController = require('../../controllers/uploadController');

const router = express.Router();

router.post('/media', auth, upload.array('files', 10), uploadController.uploadMedia);

module.exports = router;
