const { FOLLOW } = require("../Modal/follow");
const { USER } = require("../Modal/user");
const constants = require("../CommonFunction/Constants");
const MSG = require("../CommonFunction/Messages");
const { ObjectId } = require("../CommonFunction/Functions");

/**************** Follow / unfollow (private account -> follow request) */
const follow = async (req, res, next) => {
  try {
    const user = req.user;
    const body = req.body;

    ObjectId(body.followTo); // throws on invalid id
    if (body.followTo == user._id) {
      throw new Error(MSG.YOU_CANT_FOLLOW_YOU);
    }

    body.followFrom = user._id;
    const existUser = await USER.findOne({ _id: body.followTo, isDeleted: false });

    if (!existUser) {
      throw new Error(MSG.USER_DATA_MISSING);
    }

    // already following / requested -> unfollow / delete request
    const unFollow = await FOLLOW.findOneAndDelete({
      followTo: body.followTo,
      followFrom: user._id,
    });

    if (unFollow) {
      if (existUser.socialAccount == constants.SOCIAL_ACCOUNT.PUBLIC)
        return res.success(MSG.UNFOLLOW_SUCCESSFULLY, null);

      if (existUser.socialAccount == constants.SOCIAL_ACCOUNT.PRIVATE)
        return res.success(MSG.REQUEST_DELETED, null);
    }

    if (existUser.socialAccount == constants.SOCIAL_ACCOUNT.PUBLIC) {
      body.followStatus = constants.FOLLOW_STATUS.ACCEPT;
      const result = await new FOLLOW(body).save();
      if (!result) throw new Error(MSG.USER_DATA_MISSING);
      return res.success(MSG.FOLLOW_SUCCESSFULLY, result);
    }

    if (existUser.socialAccount == constants.SOCIAL_ACCOUNT.PRIVATE) {
      const result = await new FOLLOW(body).save();
      if (!result) throw new Error(MSG.USER_DATA_MISSING);
      return res.success(MSG.REQUEST_SENT, result);
    }
  } catch (err) {
    next(err);
  }
};

/**************** Accept / reject a follow request */
const acceptRejected = async (req, res, next) => {
  try {
    const body = req.body;
    let msg = "";
    if (body.followStatus == constants.FOLLOW_STATUS.ACCEPT) {
      msg = MSG.REQUEST_ACCEPT;
    }
    if (body.followStatus == constants.FOLLOW_STATUS.REJECT) {
      msg = MSG.REQUEST_DELETED;
    }

    const result = await FOLLOW.findOneAndUpdate(
      {
        followTo: req.user._id,
        _id: ObjectId(body._id),
        followStatus: constants.FOLLOW_STATUS.PENDING,
      },
      { followStatus: body.followStatus },
      { new: true },
    );
    if (!result) throw new Error(MSG.INVALID_DATA);

    return res.success(msg, result);
  } catch (err) {
    console.log("error ", err);
    next(err);
  }
};

/**************** My followers */
const myFollowers = async (req, res, next) => {
  try {
    const result = await FOLLOW.aggregate([
      {
        $match: {
          isDeleted: false,
          followTo: req.user._id,
          followStatus: constants.FOLLOW_STATUS.ACCEPT,
        },
      },
      {
        $lookup: {
          from: "users",
          let: { id: "$followFrom" },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$id"] } } }],
          as: "follower",
        },
      },
      { $unwind: { path: "$follower", preserveNullAndEmptyArrays: false } },
      {
        $project: {
          _id: 0,
          "follower._id": 1,
          "follower.email": 1,
          "follower.isEmailVerified": 1,
          "follower.phone": 1,
          "follower.isPhoneVerified": 1,
          "follower.userName": 1,
          "follower.socialAccount": 1,
          "follower.dob": 1,
          "follower.image": 1,
        },
      },
    ]);

    const followers = result.map((item) => item.follower);
    const followersCount = followers.length;

    if (followersCount === 0) {
      throw new Error(MSG.NO_USER_FOLLOWER);
    }

    return res.success(MSG.DATA_FETCHED, { followers, followersCount });
  } catch (err) {
    next(err);
  }
};

/**************** People I follow */
const following = async (req, res, next) => {
  try {
    const result = await FOLLOW.aggregate([
      {
        $match: {
          isDeleted: false,
          followFrom: req.user._id,
          followStatus: constants.FOLLOW_STATUS.ACCEPT,
        },
      },
      {
        $lookup: {
          from: "users",
          let: { id: "$followTo" },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$id"] } } }],
          as: "following",
        },
      },
      { $unwind: { path: "$following", preserveNullAndEmptyArrays: false } },
      {
        $project: {
          _id: 0,
          "following._id": 1,
          "following.email": 1,
          "following.isEmailVerified": 1,
          "following.phone": 1,
          "following.isPhoneVerified": 1,
          "following.userName": 1,
          "following.socialAccount": 1,
          "following.dob": 1,
          "following.image": 1,
        },
      },
    ]);

    const followingList = result.map((item) => item.following);
    const followingCount = followingList.length;

    if (followingCount === 0) {
      throw new Error(MSG.NO_FOLLOWING);
    }

    return res.success(MSG.DATA_FETCHED, { following: followingList, followingCount });
  } catch (err) {
    next(err);
  }
};

/**************** Pending requests received by me */
const pendingRequests = async (req, res, next) => {
  try {
    const result = await FOLLOW.find({
      isDeleted: false,
      followTo: req.user._id,
      followStatus: constants.FOLLOW_STATUS.PENDING,
    }).populate("followFrom", "firstName lastName userName email image").sort({ createdAt: -1 });

    return res.success(MSG.DATA_FETCHED, result);
  } catch (err) {
    next(err);
  }
};

/**************** Current user's relationship with a profile */
const status = async (req, res, next) => {
  try {
    const result = await FOLLOW.findOne({ isDeleted: false, followFrom: req.user._id, followTo: ObjectId(req.params.id) });
    return res.success(MSG.DATA_FETCHED, result);
  } catch (err) { next(err); }
};

module.exports = { follow, acceptRejected, myFollowers, following, pendingRequests, status };
