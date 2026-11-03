const mongoose = require("mongoose");
const constants = require("../CommonFunction/Constants");
const MSG = require("../CommonFunction/Messages");
const { getExpireDate } = require("../CommonFunction/Functions");
const EmailTemplate = require("../CommonFunction/EmailTemplate");
const { send } = require("../CommonFunction/SendMail");
const { OTPGEn } = require("./OtpGenrate");

const Schema = new mongoose.Schema(
  {
    otpType: { type: Number, enum: Object.values(constants.OTP_TYPE) },
    code: { type: String },
    phone: { type: String },
    countryCode: { type: String, trim: true },
    email: { type: String },
    expiredAt: { type: Date },
  },
  { timestamps: true },
);

// Automatically delete records after `expiredAt`
Schema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });

/**************** on save : remove old otp, generate new one, send it on email */
Schema.pre(/save|create|update/i, async function () {
  const doc = this;

  // remove old otp for same doc
  const deleteQry = { otpType: doc.otpType };

  if (doc.email) {
    deleteQry.email = doc.email;
  } else if (doc.phone && doc.countryCode) {
    deleteQry.phone = doc.phone;
    deleteQry.countryCode = doc.countryCode;
  }
  await OTP.deleteMany(deleteQry);

  const otpExpiresTime = process.env.app_otp_expires_time || "2m";
  const otpRec = {
    // code: generateNumber(4), TODO
    code: OTPGEn(),
    expiredAt: getExpireDate(otpExpiresTime),
  };

  this.set(otpRec);

  // Send otp email
  if (doc.email) {
    let otpType = "Signup";
    if (constants.OTP_TYPE.LOGIN == doc.otpType) {
      otpType = "Login";
    } else if (constants.OTP_TYPE.FORGET == doc.otpType) {
      otpType = "Forgot password";
    }

    await send({
      to: [doc.email],
      subject: MSG.SUBJECT_OTP,
      message: EmailTemplate.otp("", otpType, otpRec.code),
    });
  }

  // TODO: Send otp message (see CommonFunction/SendSMS.js)
  if (doc.phone && doc.countryCode) {
    let otpType = "Signup";
    if (constants.OTP_TYPE.LOGIN == doc.otpType) {
      otpType = "Login";
    } else if (constants.OTP_TYPE.FORGET == doc.otpType) {
      otpType = "Forgot password";
    }
    const message = `Your one time code for ${otpType} in Mitra app is ${otpRec.code}`;
    // sendSMSTwillo(doc.countryCode, doc.phone, message)
  }
});

const OTP = mongoose.model("otp", Schema);
module.exports.OTP = OTP;
