const express = require('express');
const postController = require('../../controllers/postController');
const auth = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const postValidation = require('../../validations/postValidation');

const router = express.Router();

router.post('/', auth, validate(postValidation.createPost), postController.createPost);
router.get('/', auth, validate(postValidation.listPosts), postController.listPosts);
router.get('/:id', auth, validate(postValidation.postIdParam), postController.getPost);
router.put('/:id', auth, validate(postValidation.updatePost), postController.updatePost);
router.delete('/:id', auth, validate(postValidation.postIdParam), postController.deletePost);
router.post('/:id/publish', auth, validate(postValidation.publishPost), postController.publishPost);
router.post('/:id/schedule', auth, validate(postValidation.schedulePost), postController.schedulePost);

module.exports = router;
