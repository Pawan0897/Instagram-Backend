const mongoose = require("mongoose");
const { pagination } = require("../CommonFunction/Functions");

const postSchema = new mongoose.Schema(
  {
    post: { type: String },
    video: { type: String },
    caption: { type: String },
    audio: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

postSchema.statics.list = function (filter, skip, limit) {
  const pipeline = [];
  const qry = { isDeleted: false };

  // Add search criteria
  if (filter?.search) {
    const trimmedSearch = filter.search.trim();
    const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const safeSearch = escapeRegex(trimmedSearch);
    const searchRegex = { $regex: safeSearch, $options: "i" };
    qry.$or = [{ post: searchRegex }, { _id: searchRegex }, { caption: searchRegex }];
  }
  pipeline.push({ $match: qry }, { $sort: { createdAt: -1 } });
  pipeline.push({ $project: { isDeleted: 0 } });
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

module.exports.POST = mongoose.model("posts", postSchema);
