const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    pinCode: { type: String },
    number: { type: Number },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  },
  { timestamps: true },
);

module.exports.ADDRESS = mongoose.model("address", addressSchema);
