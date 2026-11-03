const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const constants = require("../CommonFunction/Constants");
const { pagination } = require("../CommonFunction/Functions");
const { SESSIONS } = require("./sessions");

const Schema = new mongoose.Schema(
  {
    role: { type: Number, enum: Object.values(constants.ROLE), default: constants.ROLE.USER },
    accessRole: { type: mongoose.Schema.Types.ObjectId, ref: "access_roles" },
    image: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    userName: { type: String },
    bio: { type: String },
    dob: { type: Date },
    email: { type: String, trim: true, lowercase: true, index: true },
    password: { type: String },
    phone: { type: String },
    countryCode: { type: String },
    isoCode: { type: String },
    isPhoneVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    isProfileCompleted: { type: Boolean, default: false },
    qrImage: { type: String },
    location: { type: String },
    qualification: { type: String },
    socialAccount: {
      type: Number,
      enum: Object.values(constants.SOCIAL_ACCOUNT),
      default: constants.SOCIAL_ACCOUNT.PUBLIC,
    },
    gender: { type: Number, enum: Object.values(constants.GENDER) },
    grades: { type: String },
    workExperience: { type: String },
    studyPreferences: { type: Number, enum: Object.values(constants.STUDY_PREFERENCES) },
    studyLocation: [{ type: Number, enum: Object.values(constants.STUDY_LOCATION) }],
    institutionType: [{ type: Number, enum: Object.values(constants.UNIVERSITY_TYPES) }],

    isBlocked: { type: Boolean, default: false, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

Schema.virtual("addresses", {
  ref: "address",
  localField: "_id",
  foreignField: "userId",
});

// (Optional) Automatically remove deleted record after 30 days
// Schema.index({ deletedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

/**************** hash password / stamp deletedAt / drop sessions on save */
Schema.pre(/save|create/i, async function () {
  if (this.isModified("password")) {
    const password = this.get("password");
    const hashPwd = bcrypt.hashSync(password, 10);
    this.set({ password: hashPwd });
  }

  if (this.isModified("isDeleted")) {
    this.set({ deletedAt: new Date() });
  }

  // remove login sessions when delete or block user
  if (this.isModified("isBlocked") || this.isModified("isDeleted")) {
    await SESSIONS.deleteMany({ userId: this.get("_id") });
  }
});

/**************** same rules for update queries */
Schema.pre(/update/i, async function () {
  const update = this.getUpdate() || {};

  if (update.password) {
    this.set({ password: bcrypt.hashSync(update.password, 10) });
  }

  if (update.isDeleted) {
    this.set({ deletedAt: new Date() });
  }

  // remove login sessions when delete or block user
  if (update.isBlocked || update.isDeleted) {
    await SESSIONS.deleteMany({ userId: this.getQuery()._id });
  }
});

/**************** validate password */
Schema.methods.comparePassword = function (enteredPassword) {
  return bcrypt.compareSync(enteredPassword, this.password);
};

Schema.statics.getUser = function (id, qry = {}, extraSelect = {}) {
  return this.findOne({ _id: id, isDeleted: false, ...qry }).select({
    firstName: 1,
    lastName: 1,
    dateOfBirth: 1,
    image: 1,
    email: 1,
    countryCode: 1,
    phone: 1,
    isBlocked: 1,
    role: 1,
    isProfileCompleted: 1,
    isPhoneVerified: 1,
    isEmailVerified: 1,
    ...extraSelect,
  });
};

Schema.statics.updateById = function (id, data) {
  return this.findByIdAndUpdate(id, data, { new: true });
};

Schema.statics.list = function (filter, skip, limit) {
  const pipeline = [];

  const qry = {
    isDeleted: false,
    isProfileCompleted: true,
  };

  if (filter?.role) {
    qry.role = Number(filter.role);
  }

  // Add search criteria
  if (filter?.search) {
    const trimmedSearch = filter.search.trim();
    const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const safeSearch = escapeRegex(trimmedSearch);
    const searchRegex = { $regex: safeSearch, $options: "i" };
    qry.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { userName: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
    ];
  }

  pipeline.push({ $match: qry }, { $sort: { createdAt: -1 } });
  pipeline.push({ $project: { password: 0 } });

  if (skip !== undefined && limit !== undefined) {
    pipeline.push(...pagination(skip, limit));
  }

  return this.aggregate(pipeline).then((res) => {
    if (skip !== undefined && limit !== undefined) {
      return res[0];
    }
    return res;
  });
};

module.exports.USER = mongoose.model("users", Schema);
