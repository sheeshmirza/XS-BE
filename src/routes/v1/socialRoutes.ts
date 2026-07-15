//Reviewed

import express from "express";

import socialController from "../../controllers/socialController";
import auth from "../../middleware/auth";
import validate from "../../middleware/validate";
import socialValidation from "../../validations/socialValidation";

const router = express.Router();

//Step 1: List all connected social accounts

router.get(
  "/accounts",
  auth,
  socialController.listAccounts,
);

//Step 2: Connect a social account

router.post(
  "/connect/:platform",
  auth,
  validate(socialValidation.connect),
  socialController.connectPlatform,
);

//Step 3: Handle OAuth callback from social platforms

router.get(
  "/callback/:platform",
  validate(socialValidation.callback),
  socialController.oauthCallback,
);

//Step 4: Refresh social access token

router.post(
  "/refresh-token",
  auth,
  validate(socialValidation.refreshToken),
  socialController.refreshSocialToken,
);

//Step 5: Disconnect a social account

router.delete(
  "/:id",
  auth,
  validate(socialValidation.remove),
  socialController.disconnect,
);

export default router;
