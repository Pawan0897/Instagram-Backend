const { OTP } = require("../Modal/otp");
const MSG = require("./Messages");
const { ObjectId } = require("./Functions");

/**************** verify otp sent on phone (or on email when isForEmail = true) */
const verifyPhoneOtp = async (
  countryCode,
  key,
  otpCode,
  otpType,
  removeOtp = true,
  isForEmail = false,
  userId,
) => {
  const qry = {
    code: otpCode,
    otpType: otpType,
  };
  if (isForEmail) {
    qry.email = key.toLowerCase();
  } else {
    qry.phone = key;
  }
  if (userId) {
    qry.userId = ObjectId(userId);
  }
  if (countryCode) {
    qry.countryCode = countryCode;
  }
  const otp = await OTP.findOne(qry, { _id: 1, expiredAt: 1 });
  if (!otp) throw new Error(MSG.INVALID_OTP);

  if (otp.expiredAt && otp.expiredAt < new Date()) {
    throw new Error(MSG.OTP_EXPIRED);
  }

  if (otp && removeOtp) await OTP.deleteOne({ _id: otp._id });

  return otp;
};

/**************** verify otp sent on email */
const verifyEmailCode = async (email, code, otpType, removeOtp = true) => {
  return await verifyPhoneOtp(null, email, code, otpType, removeOtp, true);
};

module.exports = { verifyPhoneOtp, verifyEmailCode };
