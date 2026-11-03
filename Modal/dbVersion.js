const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
  {
    version: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports.DB_VERSION = mongoose.model("dbversions", Schema);
