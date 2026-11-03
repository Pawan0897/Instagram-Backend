const mongoose = require("mongoose");
const constants = require("../CommonFunction/Constants");

const Schema = new mongoose.Schema(
  {
    followFrom: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    followStatus: {
      type: Number,
      enum: Object.values(constants.FOLLOW_STATUS),
      default: constants.FOLLOW_STATUS.PENDING,
    },
    followTo: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

module.exports.FOLLOW = mongoose.model("follow", Schema);
