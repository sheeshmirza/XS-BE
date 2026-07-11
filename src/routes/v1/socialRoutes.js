const express = require('express');
const socialController = require('../../controllers/socialController');
const auth = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const socialValidation = require('../../validations/socialValidation');

const router = express.Router();

router.get('/accounts', auth, socialController.listAccounts);
router.post('/connect/:platform', auth, validate(socialValidation.connect), socialController.connectPlatform);
router.get('/callback/:platform', validate(socialValidation.callback), socialController.oauthCallback);
router.delete('/:id', auth, validate(socialValidation.remove), socialController.disconnect);
router.post('/refresh-token', auth, validate(socialValidation.refreshToken), socialController.refreshSocialToken);

module.exports = router;
