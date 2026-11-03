const _ = require("lodash");
const crypto = require("crypto");
const moment = require("moment");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Handlebars = require("handlebars");
const constants = require("./Constants");

/**************** default page size used by list APIs */
module.exports.PAGINATION_LIMIT = 10;

/**************** new ObjectId from string (throws on invalid id) */
module.exports.ObjectId = (key) => new mongoose.Types.ObjectId(key);

/**************** public url of an uploaded image (served from /images) */
module.exports.getImageUrl = (filename) =>
  `${process.env.BASE_URL || "http://localhost:3000"}/images/${filename}`;

module.exports.getExpireDate = (tokenExpiresTime) => {
  const match = tokenExpiresTime.match(/^(\d+)([a-zA-Z]+)$/); // number + unit
  if (!match) throw new Error("Invalid tokenExpiresTime format");
  const value = parseInt(match[1], 10);
  const unit = match[2]; // 'h', 'd', 'm', etc.
  return moment().add(value, unit).toDate();
};

module.exports.toHex = (val) => Buffer.from(val, "utf8").toString("hex");
module.exports.toStr = (val) => Buffer.from(val, "hex").toString("utf8");

module.exports.generateRandomStringAndNumbers = (len) =>
  _.times(len, () => _.random(35).toString(36)).join("");

module.exports.setPrecision = async (no, precision) => {
  precision = precision || 2;
  if (!isNaN(no)) {
    return (+(Math.round(+(no + "e" + precision)) + "e" + -precision)).toFixed(precision);
  }
  return 0;
};

module.exports.hashPasswordUsingBcrypt = async (plainTextPassword) => {
  try {
    return bcrypt.hashSync(plainTextPassword, 10);
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports.comparePasswordUsingBcrypt = (pass, hash) => {
  try {
    return bcrypt.compareSync(pass, hash);
  } catch (error) {
    console.log("error: ", error);
    throw new Error(error.message);
  }
};

module.exports.prettyCase = (str) => {
  if (typeof str == "string" && /^[A-Z_]+$/.test(str)) {
    str = _.lowerCase(str);
    str = _.startCase(str);
  }
  return str;
};

module.exports.toDecimals = (val, decimal = 2) => {
  const base = Math.pow(10, decimal);
  return Math.round(val * base) / base;
};

module.exports.generateRandomString = (n) => crypto.randomBytes(n).toString("hex");

module.exports.generateNumber = (len) => _.random(10 ** len, 9 ** len);

module.exports.generateRandomCustom = (length) => {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

module.exports.generatePassword = () => {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@#$%&*";
  // at least one char from each required set
  const password = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];
  const allCharacters = upper + lower + digits + special;
  const remainingLength = 8 - password.length;
  for (let i = 0; i < remainingLength; i++) {
    password.push(allCharacters[Math.floor(Math.random() * allCharacters.length)]);
  }
  // shuffle
  for (let i = password.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [password[i], password[j]] = [password[j], password[i]];
  }
  return password.join("");
};

/**************** aggregation stages for skip/limit with total count */
module.exports.pagination = (skip, limit) => [
  {
    $group: {
      _id: null,
      totalCount: { $sum: 1 },
      results: { $push: "$$ROOT" },
    },
  },
  {
    $project: {
      _id: 0,
      totalCount: 1,
      list: { $slice: ["$results", skip, limit] },
    },
  },
];

/**************** build message/title for notifications from templates */
module.exports.renderTemplateField = async (inputKeysObj, values, lang, payloadData) => {
  lang = lang || "en";
  const sendObj = {};
  sendObj.receiverId = payloadData.receiverId ? payloadData.receiverId : null;
  sendObj.driverId = payloadData.driverId ? payloadData.driverId : null;
  sendObj.ticketId = payloadData.ticketId ? payloadData.ticketId : null;
  sendObj.adminId = payloadData.adminId ? payloadData.adminId : null;
  sendObj.time = payloadData.time ? payloadData.time : 0;
  sendObj.bookingId = payloadData.bookingId ? payloadData.bookingId : null;
  sendObj.userId = payloadData.userId ? payloadData.userId : null;
  sendObj.role = payloadData.role ? payloadData.role : constants.ROLE.USER;
  sendObj.isNotificationSave = payloadData.isNotificationSave
    ? payloadData.isNotificationSave
    : false;
  sendObj.pushType = payloadData.pushType ? payloadData.pushType : 0;
  if (values) values = JSON.parse(JSON.stringify(values));

  const keys = inputKeysObj.keys || [];
  for (let i = 0; i < keys.length; i++) {
    keys[i].value = values[keys[i].key];
  }
  let source = inputKeysObj.message[lang] || null;
  let template = Handlebars.compile(source) || null;
  const message = template(values) || payloadData.message;
  source = inputKeysObj.title[lang] || null;
  template = Handlebars.compile(source) || null;
  const title = template(values) || payloadData.title;
  sendObj.message = message;
  sendObj.title = title;
  sendObj.keys = keys;
  sendObj.data = values;
  return sendObj;
};
