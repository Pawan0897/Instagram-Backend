const { LIKE } = require("../Modal/like");
const { POST } = require("../Modal/post");
const MSG = require("../CommonFunction/Messages");
const { ObjectId } = require("../CommonFunction/Functions");

/**************** Like / unlike a post (toggle) */
const create = async (req, res, next) => {
  try {
    const body = req.body;
    body.userId = req.user._id;
    body.postId = ObjectId(body.postId);

    const checkPost = await POST.findOne({ _id: body.postId, isDeleted: false });

    if (!checkPost) {
      throw new Error(MSG.POST_ID_NOT_FOUND);
    }

    const existLiked = await LIKE.findOneAndDelete({
      postId: body.postId,
      userId: body.userId,
    });

    if (existLiked) {
      return res.success(MSG.UNLIKED_SUCCESSFULLY, null);
    }

    const result = await new LIKE(body).save();

    if (!result) throw new Error(MSG.NOT_FOUND);

    return res.success(MSG.LIKED_SUCCESSFULLY, result);
  } catch (err) {
    next(err);
  }
};

/**************** Post with its likes + likeCount (:id = postId) */
const likeCount = async (req, res, next) => {
  try {
    const result = await POST.aggregate([
      { $match: { _id: ObjectId(req.params.id), isDeleted: false } },
      {
        $lookup: {
          from: "likes",
          let: { id: "$_id" },
          pipeline: [{ $match: { $expr: { $eq: ["$postId", "$$id"] } } }],
          as: "likeDetails",
        },
      },
      { $addFields: { likeCount: { $size: "$likeDetails" } } },
    ]);

    if (!result.length) {
      throw new Error(MSG.POST_ID_NOT_FOUND);
    }

    return res.success(MSG.DATA_FETCHED, result);
  } catch (err) {
    next(err);
  }
};

/**************** Did I like this post? (:id = postId) */
const likeByMe = async (req, res, next) => {
  try {
    const result = await LIKE.find({
      userId: req.user._id,
      postId: ObjectId(req.params.id),
    });

    if (!result.length) {
      throw new Error(MSG.YOU_NOT_LIKED_POST);
    }

    return res.success(MSG.POST_LIKED_BY_YOU, result);
  } catch (err) {
    next(err);
  }
};

/**************** Users who liked a post (:id = postId) */
const likeUserListing = async (req, res, next) => {
  try {
    const result = await LIKE.aggregate([
      { $match: { postId: ObjectId(req.params.id) } },
      {
        $lookup: {
          from: "users",
          let: { id: "$userId" },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$id"] } } }],
          as: "userDetails",
        },
      },
      {
        $project: {
          _id: 1,
          isLiked: 1,
          postId: 1,
          "userDetails.email": 1,
          "userDetails.isEmailVerified": 1,
          "userDetails.phone": 1,
          "userDetails.isPhoneVerified": 1,
          "userDetails.userName": 1,
          "userDetails.country": 1,
          "userDetails.city": 1,
        },
      },
      { $addFields: { likeCount: { $size: "$userDetails" } } },
    ]);

    if (!result.length) {
      throw new Error(MSG.POST_ID_NOT_FOUND);
    }

    return res.success(MSG.DATA_FETCHED, result);
  } catch (err) {
    next(err);
  }
};

/**************** Posts liked by me */
const myLikedPost = async (req, res, next) => {
  try {
    const result = await LIKE.find({ userId: req.user._id }).populate("postId", "post");

    return res.success(MSG.DATA_FETCHED, result);
  } catch (err) {
    console.log("error ", err);
    next(err);
  }
};

module.exports = { create, likeCount, likeByMe, likeUserListing, myLikedPost };
