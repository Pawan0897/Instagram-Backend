const mongoose = require("mongoose");
const constants = require("../CommonFunction/Constants");
const { pagination } = require("../CommonFunction/Functions");

const Schema = new mongoose.Schema(
  {
    name: { type: String },
    name_ar: { type: String },
    permission: [
      {
        sideBarId: { type: Number, enum: Object.values(constants.MODULES) },
        label: { type: String },
        path: { type: String },
        icon: { type: String },
        isSubMenu: { type: Boolean, default: false },
        subMenuItems: [],
        isSubAdmin: { type: Boolean, default: false },
        _id: { type: String },
        id: { type: String },
        isView: { type: Boolean, default: false },
        isAdd: { type: Boolean, default: false },
        isEdit: { type: Boolean, default: false },
        isDelete: { type: Boolean, default: false },
      },
    ],
    isBlocked: { type: Boolean, default: false, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

Schema.pre(/save|create|update/i, async function () {
  if (this.get("isDeleted")) {
    this.set({ deletedAt: new Date() });
  }
});

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

module.exports.ACCESS_ROLE = mongoose.model("access_roles", Schema);
