const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    text: { type: String },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "posts" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports.COMMENT = mongoose.model("comment", commentSchema);
