const { USER } = require("../Modal/user");
const { OTP } = require("../Modal/otp");
const { SESSIONS } = require("../Modal/sessions");
const { ACCESS_ROLE } = require("../Modal/accessRole");
const { POST } = require("../Modal/post");
const constants = require("../CommonFunction/Constants");
const MSG = require("../CommonFunction/Messages");
const {
  generateRandomStringAndNumbers,
  hashPasswordUsingBcrypt,
  getImageUrl,
} = require("../CommonFunction/Functions");
const { verifyEmailCode, verifyPhoneOtp } = require("../CommonFunction/OtpService");
const { getToken } = require("../Midleware/auth");

/**
 * NOTE : these handlers are shared by the user portal  (/onboarding/*)
 *        and the admin portal (/admin/onboarding/*, see Controller/admin.js).
 *        req.portal ("user" | "staff" | "admin") is set by Midleware/portal.js
 */

/**************** role(s) allowed to login / get otp on this portal */
const getPortalRole = (req) =>
  req.portal === "admin"
    ? { $in: [constants.ROLE.ADMIN, constants.ROLE.SUB_ADMIN] }
    : constants.ROLE.USER;

/**************** logged in person : req.admin on admin routes, req.user on user routes */
const getMe = (req) => req.admin || req.user;

/**************** delete old sessions, create a new one and return user + token */
const loginResponse = async (user, body, portal, isForget = false) => {
  await SESSIONS.deleteMany({ userId: user._id });

  const session = await new SESSIONS({
    deviceType: body.deviceType,
    deviceToken: body.deviceToken,
    jti: generateRandomStringAndNumbers(20),
    userId: user._id,
  }).save();

  return {
    ...user.toObject(),
    token: getToken({ _id: session._id, jti: session.jti, isForget }, portal),
    tokenType: "Bearer",
    password: undefined,
  };
};

/**************** Signup (email + password) */
const signup = async (req, res, next) => {
  try {
    const body = req.body;
    const email = body.email.toLowerCase();

    const exist = await USER.findOne({ email, isDeleted: false });
    if (exist) throw new Error(MSG.EMAIL_ALREADY_IN_USE);

    const user = await new USER({
      firstName: body.firstName,
      lastName: body.lastName,
      email,
      password: body.password,
      phone: body.phone,
      countryCode: body.countryCode,
      role: constants.ROLE.USER,
      isEmailVerified: true,
    }).save();

    const result = await loginResponse(user, body, req.portal);

    return res.success(MSG.ACCOUNT_CREATED_SUCCESSFULLY, result);
  } catch (err) {
    next(err);
  }
};

/**************** Send OTP  (signup / login / forget / update) */
const sendOtp = async (req, res, next) => {
  try {
    const body = req.body;
    const qry = { isDeleted: false };

    if (body.email) {
      qry.email = body.email;
      qry.isEmailVerified = true;
    } else if (body.phone) {
      qry.phone = body.phone;
      qry.countryCode = body.countryCode;
      qry.isPhoneVerified = true;
    }

    if (body.otpType == constants.OTP_TYPE.LOGIN || body.otpType == constants.OTP_TYPE.FORGET) {
      qry.role = getPortalRole(req);
    }

    const user = await USER.findOne(qry);

    if ([constants.OTP_TYPE.LOGIN, constants.OTP_TYPE.FORGET].includes(Number(body.otpType))) {
      if (!user) throw new Error(MSG.ACCOUNT_NOT_FOUND);
    } else if (user && [constants.OTP_TYPE.SIGNUP].includes(Number(body.otpType))) {
      if (body.email) throw new Error(MSG.EMAIL_ALREADY_IN_USE);
      if (body.phone) throw new Error(MSG.PHONE_ALREADY_IN_USE);
    }

    const otp = new OTP(body);
    await otp.save();

    return res.success(MSG.OTP_SENT, body);
  } catch (err) {
    next(err);
  }
};

/**************** Verify OTP  (signup creates the user, forget resets password) */
const verifyOtp = async (req, res, next) => {
  try {
    const body = req.body;
    let otp, user;
    const qry = { isDeleted: false };

    body.otpType = Number(body.otpType);

    if (body.email) {
      body.isEmailVerified = true;
      qry.isEmailVerified = true;
      qry.email = body.email;
      otp = await verifyEmailCode(body.email, body.code, body.otpType);
    } else if (body.phone) {
      body.isPhoneVerified = true;
      qry.isPhoneVerified = true;
      qry.phone = body.phone;
      qry.countryCode = body.countryCode;
      otp = await verifyPhoneOtp(body.countryCode, body.phone, body.code, body.otpType);
    } else {
      throw new Error(MSG.INVALID_INPUT);
    }

    if (!otp) throw new Error(MSG.INVALID_OTP);

    if (body.otpType == constants.OTP_TYPE.LOGIN || body.otpType == constants.OTP_TYPE.FORGET) {
      qry.role = getPortalRole(req);
    }
    user = await USER.findOne(qry);

    if (body.otpType == constants.OTP_TYPE.LOGIN || body.otpType == constants.OTP_TYPE.FORGET) {
      if (!user) throw new Error(MSG.ACCOUNT_NOT_FOUND);

      if (body.otpType == constants.OTP_TYPE.FORGET && body.password) {
        await USER.findOneAndUpdate({ _id: user._id }, { password: body.password });
        await SESSIONS.deleteMany({ userId: user._id });
        return res.success(MSG.PASSWORD_CHANGED_SUCCESSFULLY, user);
      }
    } else if (body.otpType == constants.OTP_TYPE.SIGNUP) {
      if (user && body.email) throw new Error(MSG.EMAIL_ALREADY_IN_USE);
      else if (user && body.phone) throw new Error(MSG.PHONE_ALREADY_IN_USE);
      qry.role = constants.ROLE.USER;
      // Create new user
      if (body.password) qry.password = body.password;
      const userData = {
        ...qry,
        isEmailVerified: body.isEmailVerified,
        isPhoneVerified: body.isPhoneVerified,
      };
      user = await new USER(userData).save();
    } else {
      throw new Error(MSG.INVALID_INPUT);
    }

    const isForget = body.otpType == constants.OTP_TYPE.FORGET;
    const result = await loginResponse(user, body, req.portal, isForget);

    return res.success(MSG.OTP_VERIFIED, result);
  } catch (err) {
    next(err);
  }
};

/**************** Login with email + password */
const login = async (req, res, next) => {
  try {
    const body = req.body;
    body.role = getPortalRole(req);

    const user = await USER.findOne({
      email: body.email,
      isEmailVerified: true,
      isDeleted: false,
      role: body.role,
    }).populate("accessRole");
    if (!user) throw new Error(MSG.ACCOUNT_NOT_FOUND);

    if (!user.password) throw new Error(MSG.PASSWORD_NOT_SET);
    const isMatch = await user.comparePassword(body.password);
    if (!isMatch) throw new Error(MSG.INVALID_CREDENTIALS);
    if (user.isBlocked) throw new Error(MSG.ACCOUNT_BLOCKED);

    const result = await loginResponse(user, body, req.portal);

    return res.success(MSG.LOGIN_SUCCESS, result);
  } catch (err) {
    next(err);
  }
};

/**************** Change password (or reset it after forget-password otp) */
const changePassword = async (req, res, next) => {
  try {
    const user = getMe(req);
    const body = req.body;

    const userExist = await USER.findOne(
      { _id: user._id },
      { password: 1, isEmailVerified: 1, isBlocked: 1 },
    );
    if (!userExist) throw new Error(MSG.ACCOUNT_NOT_FOUND);
    if (!userExist.isEmailVerified) throw new Error(MSG.EMAIL_NOT_VERIFIED);
    if (userExist.isBlocked) throw new Error(MSG.ACCOUNT_BLOCKED);

    if (!body.resetPassword) {
      if (!userExist.password) throw new Error(MSG.PASSWORD_NOT_SET);
      const isMatch = await userExist.comparePassword(body.oldPassword || "");
      if (!isMatch) throw new Error(MSG.OLD_PASS_NOT_MATCH);
    }
    const isOldSame = await userExist.comparePassword(body.newPassword);
    if (isOldSame) throw new Error(MSG.PASSWORDS_SHOULD_BE_DIFFERENT);

    userExist.password = body.newPassword;
    await userExist.save();
    userExist.password = undefined;

    return res.success(MSG.PASSWORD_CHANGED_SUCCESSFULLY, userExist);
  } catch (err) {
    next(err);
  }
};

/**************** Get own profile */
const getProfile = async (req, res, next) => {
  try {
    const user = getMe(req);
    const result = Object.assign({}, user);
    if (user.role == constants.ROLE.SUB_ADMIN) {
      const accessRole = await ACCESS_ROLE.findOne({ _id: user.accessRole, isDeleted: false });
      Object.assign(result, { accessRole });
    }

    result.password = undefined;
    return res.success(MSG.DATA_FETCHED, result);
  } catch (err) {
    next(err);
  }
};

/**************** Logout */
const logout = async (req, res, next) => {
  try {
    const user = getMe(req);
    await SESSIONS.deleteOne({ userId: user._id });
    return res.success(MSG.LOGOUT_SUCCESS, "👿");
  } catch (err) {
    next(err);
  }
};

/**************** Update profile */
const updateProfile = async (req, res, next) => {
  try {
    const user = getMe(req);
    const body = req.body;

    if (body.email) {
      const emailExist = await USER.findOne({
        _id: { $ne: user._id },
        email: body.email,
        isEmailVerified: true,
        isDeleted: false,
      });
      if (emailExist) throw new Error(MSG.EMAIL_ALREADY_IN_USE);
    }

    if (body.phone) {
      const phoneExist = await USER.findOne({
        _id: { $ne: user._id },
        phone: body.phone,
        countryCode: body.countryCode,
        isPhoneVerified: true,
        isDeleted: false,
      });
      if (phoneExist) throw new Error(MSG.PHONE_ALREADY_IN_USE);
    }
    if (body.secretPin) {
      body.secretPin = await hashPasswordUsingBcrypt(body.secretPin);
    }

    const userExist = await USER.findOneAndUpdate({ _id: user._id, isDeleted: false }, body, {
      new: true,
    });
    if (!userExist) throw new Error(MSG.ACCOUNT_NOT_FOUND);

    userExist.password = undefined;
    return res.success(MSG.PROFILE_UPDATED_SUCCESSFULLY, userExist);
  } catch (err) {
    next(err);
  }
};

/**************** Send OTP to update email / phone */
const sendOtpToUpdate = async (req, res, next) => {
  try {
    const user = getMe(req);
    const body = req.body;
    const qry = { isDeleted: false };

    if (body.email) {
      qry.email = body.email;
      qry.isEmailVerified = true;
    } else if (body.phone) {
      qry.phone = body.phone;
      qry.countryCode = body.countryCode;
      qry.isPhoneVerified = true;
    }

    qry._id = { $ne: user._id };
    const userExist = await USER.findOne(qry);

    if (userExist && body.email) throw new Error(MSG.EMAIL_ALREADY_IN_USE);
    else if (userExist && body.phone) throw new Error(MSG.PHONE_ALREADY_IN_USE);

    body.userId = user._id;
    const otp = new OTP(body);
    await otp.save();

    return res.success(MSG.OTP_SENT_SUCCESSFULLY);
  } catch (err) {
    next(err);
  }
};

/**************** Verify OTP and update email / phone */
const verifyOtpToUpdate = async (req, res, next) => {
  try {
    const user = getMe(req);
    const body = req.body;
    let otp;
    const qry = { isDeleted: false };

    if (body.email) {
      body.isEmailVerified = true;
      qry.isEmailVerified = true;
      qry.email = body.email;
      otp = await verifyEmailCode(body.email, body.code, body.otpType);
    } else if (body.phone) {
      body.isPhoneVerified = true;
      qry.phone = body.phone;
      qry.isPhoneVerified = true;
      qry.countryCode = body.countryCode;
      otp = await verifyPhoneOtp(body.countryCode, body.phone, body.code, body.otpType);
    }
    if (!otp) throw new Error(MSG.INVALID_OTP);

    const existingUser = await USER.findOne(qry);
    if (existingUser) {
      if (body.email) throw new Error(MSG.EMAIL_ALREADY_IN_USE);
      if (body.phone) throw new Error(MSG.PHONE_ALREADY_IN_USE);
    }
    const updatedUser = await USER.updateById(user._id, body);
    updatedUser.password = undefined;

    return res.success(MSG.OTP_VERIFIED, updatedUser);
  } catch (err) {
    next(err);
  }
};

/**************** Delete own account (soft delete) */
const deleteAccount = async (req, res, next) => {
  try {
    const result = await USER.findOneAndUpdate(
      { _id: req.user._id, isDeleted: false },
      { isDeleted: true },
    );
    if (!result) throw new Error(MSG.INVALID_ID);

    return res.success(MSG.ACCOUNT_DELETED_SUCCESSFULLY);
  } catch (err) {
    next(err);
  }
};

/**************** All signup accounts except the logged-in user */
const listUsers = async (req, res, next) => {
  try {
    const users = await USER.find({
      _id: { $ne: req.user._id },
      role: constants.ROLE.USER,
      isDeleted: false,
      isBlocked: { $ne: true },
    })
      .select("firstName lastName userName email image location socialAccount")
      .sort({ createdAt: -1 });

    return res.success(MSG.DATA_FETCHED, users);
  } catch (err) {
    next(err);
  }
};

/**************** Upload profile photo (form-data key: import_posts) */
const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) throw new Error(MSG.INVALID_INPUT);
    const userExist = await USER.findOneAndUpdate(
      { _id: req.user._id, isDeleted: false },
      { image: getImageUrl(req.file.filename) },
      { new: true },
    );
    if (!userExist) throw new Error(MSG.ACCOUNT_NOT_FOUND);
    userExist.password = undefined;
    return res.success(MSG.PROFILE_UPDATED_SUCCESSFULLY, userExist);
  } catch (err) {
    next(err);
  }
};

/**************** POST /onboarding/ : upload an image and save it as a post of the user (kept from original) */
const create = async (req, res, next) => {
  try {
    const body = req.body;
    if (!req.file) throw new Error(MSG.INVALID_INPUT);
    body.post = getImageUrl(req.file.filename);
    body.userId = req.user._id;
    const result = await new POST(body).save();
    if (!result) throw new Error(MSG.NOT_FOUND);
    return res.success(MSG.CREATE_SUCCESSFULLY, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
};
