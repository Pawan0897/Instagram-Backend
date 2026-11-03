const mongoose = require("mongoose");
const constants = require("../CommonFunction/Constants");
const { getExpireDate } = require("../CommonFunction/Functions");

const Schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
    jti: { type: String, index: true },
    deviceType: { type: String, enum: Object.values(constants.DEVICETYPE) },
    deviceToken: { type: String, index: true },
    expiresAt: { type: Date },
  },
  { timestamps: true },
);

// Token cleanup: Automatically remove expired tokens
Schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

Schema.pre(/save|create|update/i, async function () {
  const tokenExpiresTime = process.env.app_token_expires_time || "24h";
  this.set({ expiresAt: getExpireDate(tokenExpiresTime) });
});

/**************** device tokens of the given users (active sessions only) */
Schema.statics.tokensList = async function (userIds) {
  try {
    const sessions = await this.find(
      {
        userId: { $in: userIds },
        expiresAt: { $gt: new Date() },
        deviceToken: { $exists: true, $ne: "" },
      },
      { deviceToken: 1 },
    );
    return sessions.map((session) => session.deviceToken);
  } catch (err) {
    console.error("Error fetching sessions:", err);
    throw err;
  }
};

module.exports.SESSIONS = mongoose.model("sessions", Schema);
