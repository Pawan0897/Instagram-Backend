/**************** User portal : mounted on /onboarding  (header x-portal: user) */
const express = require("express");
const router = express.Router();
const {
  signup,
  sendOtp,
  verifyOtp,
  login,
  changePassword,
  getProfile,
  logout,
  updateProfile,
  sendOtpToUpdate,
  verifyOtpToUpdate,
  deleteAccount,
  listUsers,
  updateAvatar,
  create,
} = require("../Controller/user");
const { verify } = require("../Midleware/auth");
const Validator = require("../Midleware/validator");
const { uploads } = require("../Midleware/multer");
const Validation = require("../Validation/user");

/**************** Signup (email + password) */
router.post("/signup", Validator(Validation.register), signup);

/**************** Send OTP (signup / login / forget) */
router.post("/send-otp", Validator(Validation.sendOtp), sendOtp);

/**************** Verify OTP */
router.post("/verify-otp", Validator(Validation.verifyOtp), verifyOtp);

/**************** Login with email + password */
router.post("/login", Validator(Validation.login), login);

/**************** Change or reset password */
router.post(
  "/change-password",
  verify("user"),
  Validator(Validation.changePassword),
  changePassword,
);

/**************** Get profile */
router.get("/", verify("user"), getProfile);

/**************** All users except me */
router.get("/users", verify("user"), listUsers);

/**************** Profile photo */
router.put("/avatar", verify("user"), uploads, updateAvatar);

/**************** Logout */
router.get("/logout", verify("user"), logout);

/**************** Update profile */
router.put("/user", verify("user"), Validator(Validation.updateProfile), updateProfile);

/**************** Send OTP to update email / phone */
router.post("/send-otp-to-update", verify("user"), Validator(Validation.sendOtp), sendOtpToUpdate);

/**************** Verify OTP to update email / phone */
router.post(
  "/verify-otp-to-update",
  verify("user"),
  Validator(Validation.verifyOtp),
  verifyOtpToUpdate,
);

/**************** Delete account */
router.delete("/", verify("user"), deleteAccount);

/**************** Upload image (key: import_posts) and save as post */
router.post("/", verify("user"), uploads, create);

module.exports = router;
