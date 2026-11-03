/**************** Admin portal : mounted on /admin/onboarding  (header x-portal: admin) */
const express = require("express");
const router = express.Router();
const {
  sendOtp,
  verifyOtp,
  login,
  changePassword,
  getProfile,
  logout,
  updateProfile,
} = require("../Controller/admin");
const { verify } = require("../Midleware/auth");
const Validator = require("../Midleware/validator");
const Validation = require("../Validation/user");

/**************** Send OTP (login / forget) */
router.post("/send-otp", Validator(Validation.sendOtp), sendOtp);

/**************** Verify OTP */
router.post("/verify-otp", Validator(Validation.verifyOtp), verifyOtp);

/**************** Login with email + password */
router.post("/login", Validator(Validation.login), login);

/**************** Change or reset password */
router.post(
  "/change-password",
  verify("admin", "sub_admin"),
  Validator(Validation.changePassword),
  changePassword,
);

/**************** Get profile */
router.get("/", verify("admin", "sub_admin"), getProfile);

/**************** Logout */
router.get("/logout", verify("admin", "sub_admin"), logout);

/**************** Update profile */
router.put("/", verify("admin", "sub_admin"), Validator(Validation.updateProfile), updateProfile);

module.exports = router;
