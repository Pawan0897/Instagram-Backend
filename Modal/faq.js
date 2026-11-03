const mongoose = require("mongoose");
const { pagination } = require("../CommonFunction/Functions");

const Schema = new mongoose.Schema(
  {
    question: { type: String },
    answer: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

// (Optional) Automatically remove deleted record after 30 days
// Schema.index({ deletedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

Schema.pre(/save|create|update/i, async function () {
  if (this.get("isDeleted")) {
    this.set({ deletedAt: new Date() });
  }
});

Schema.statics.updateById = function (id, data) {
  return this.findByIdAndUpdate(id, data, { new: true });
};

Schema.statics.list = function (filter, skip, limit) {
  const pipeline = [];

  pipeline.push({ $match: { isDeleted: false } });

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

module.exports.FAQ = mongoose.model("faqs", Schema);
