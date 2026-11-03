const { POST } = require("../Modal/post");
const { FOLLOW } = require("../Modal/follow");
const constants = require("../CommonFunction/Constants");
const MSG = require("../CommonFunction/Messages");
const { getImageUrl } = require("../CommonFunction/Functions");

/**************** Create post (image upload, form-data key "import_posts") */
const create = async (req, res, next) => {
  try {
    const body = req.body;
    if (!req.file) throw new Error(MSG.INVALID_INPUT);
    body.post = getImageUrl(req.file.filename);
    body.userId = req.user._id;
    const result = await new POST(body).save();
    if (!result) throw new Error(MSG.NOT_FOUND);
    return res.success(MSG.CREATE_SUCCESSFULLY, result);
  } catch (err) {
    console.log("error: ", err);
    next(err);
  }
};

/**************** Feed : my posts + posts of people I follow (newest first, 10 per page) */
const list = async (req, res, next) => {
  try {
    const user = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const followedUserIds = await FOLLOW.find({
      followFrom: user._id,
      followStatus: constants.FOLLOW_STATUS.ACCEPT,
      isDeleted: false,
    }).distinct("followTo");
    followedUserIds.push(user._id);

    const result = await POST.aggregate([
      {
        $match: {
          isDeleted: false,
          userId: { $in: followedUserIds },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          post: 1,
          caption: 1,
          createdAt: 1,
          userId: 1,
          "user.userName": 1,
          "user.image": 1,
          "user.location": 1,
          "user.firstName": 1,
          "user.lastName": 1,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    return res.success(MSG.DATA_FETCHED, result);
  } catch (err) {
    console.error("Feed error:", err);
    next(err);
  }
};

/**************** My posts */
const myPost = async (req, res, next) => {
  try {
    const result = await POST.find({ userId: req.user._id, isDeleted: false });
    if (!result) throw new Error(MSG.INVALID_ID);
    return res.success(MSG.DATA_FETCHED, result);
  } catch (err) {
    next(err);
  }
};

/**************** Post by id */
const getById = async (req, res, next) => {
  try {
    const result = await POST.findOne({ _id: req.params.id, isDeleted: false }).populate([
      { path: "userId", select: "userName email city country phone  email dob" },
    ]);
    if (!result) throw new Error(MSG.INVALID_ID);
    return res.success(MSG.DATA_FETCHED, result);
  } catch (err) {
    next(err);
  }
};

/**************** Update own post */
const update = async (req, res, next) => {
  try {
    const body = req.body;
    if (req.file) body.post = getImageUrl(req.file.filename);
    const data = await POST.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, isDeleted: false },
      body,
      { new: true },
    );
    if (!data) throw new Error(MSG.NOT_FOUND);
    return res.success(MSG.UPDATED_SUCCESSFULLY, data);
  } catch (err) {
    next(err);
  }
};

/**************** Delete own post (soft delete) */
const deleted = async (req, res, next) => {
  try {
    const data = await POST.findOneAndUpdate(
      { _id: req.body.postId, userId: req.user._id, isDeleted: false },
      { isDeleted: true },
      { new: true },
    );
    if (!data) throw new Error(MSG.NOT_FOUND);
    return res.success(MSG.DELETED_SUCCESSFULLY, "👺");
  } catch (err) {
    next(err);
  }
};

module.exports = { create, list, myPost, getById, update, deleted };
