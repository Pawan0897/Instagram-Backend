/**
 * Admin portal  (/admin/onboarding/*)
 * The admin APIs behave exactly like the user ones, only the allowed roles differ
 * (ADMIN / SUB_ADMIN instead of USER). That is decided by req.portal = "admin"
 * (set by Midleware/portal.js), so the same handlers are reused here.
 */
const {
  sendOtp,
  verifyOtp,
  login,
  changePassword,
  getProfile,
  logout,
  updateProfile,
} = require("./user");

module.exports = {
  sendOtp,
  verifyOtp,
  login,
  changePassword,
  getProfile,
  logout,
  updateProfile,
};
