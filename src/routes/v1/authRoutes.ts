//Reviewed

import express from "express";

import authController from "../../controllers/authController";
import auth from "../../middleware/auth";
import validate from "../../middleware/validate";
import authValidation from "../../validations/authValidation";

const router = express.Router();

//Step 1: Register a new user

router.post(
  "/signup",
  validate(authValidation.signup),
  authController.signup,
);

//Step 2: Verify email after signup

router.post(
  "/verify-email",
  validate(authValidation.verifyEmail),
  authController.verifyEmail,
);

//Step 3: Login with email and password

router.post(
  "/login",
  validate(authValidation.login),
  authController.login,
);

//Step 4: Refresh access token using refresh token

router.post(
  "/refresh",
  validate(authValidation.refresh),
  authController.refresh,
);

//Step 5: Logout and access/refresh token

router.post(
  "/logout",
  auth,
  validate(authValidation.logout),
  authController.logout,
);

//Step 6: Forgot password

router.post(
  "/forgot-password",
  validate(authValidation.forgotPassword),
  authController.forgotPassword,
);

//Step 7: Reset password

router.post(
  "/reset-password",
  validate(authValidation.resetPassword),
  authController.resetPassword,
);

export default router;
