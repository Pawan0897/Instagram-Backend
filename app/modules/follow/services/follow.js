/**
 * Function to create
 * @param {*} body
 * @returns
 */
module.exports.followRequestSend = async (user, body) => {
    try {

        ObjectId(body.followTo)
        if (body.followTo == user._id) { throw new Error(MSG.YOU_CANT_FOLLOW_YOU); }

        body.followFrom = user._id
        let existUser = await dbHelper.findOne(Model.User, { _id: body.followTo, isDeleted: false })

        if (!existUser) { throw new Error(MSG.USER_DATA_MISSING); }

        let unFollow = await Model.Follow.findOneAndDelete({
            followTo: body.followTo,
            followFrom: user._id
        })

        if (unFollow) {
            if (existUser.socialAccount == constants.SOCIAL_ACCOUNT.PUBLIC)
                return { data: null, message: MSG.UNFOLLOW_SUCCESSFULLY };

            if (existUser.socialAccount == constants.SOCIAL_ACCOUNT.PRIVATE)
                return { data: null, message: MSG.REQUEST_DELETED };
        }


        if (existUser.socialAccount == constants.SOCIAL_ACCOUNT.PUBLIC) {
            body.followStatus = constants.FOLLOW_STATUS.ACCEPT
            let result = await dbHelper.create(Model.Follow, body)
            if (!result) throw new Error(MSG.USER_DATA_MISSING);
            return { data: result, message: MSG.FOLLOW_SUCCESSFULLY };
        }


        if (existUser.socialAccount == constants.SOCIAL_ACCOUNT.PRIVATE) {
            let result = await dbHelper.create(Model.Follow, body)
            if (!result) throw new Error(MSG.USER_DATA_MISSING);
            return { data: result, message: MSG.REQUEST_SENT };
        }

    } catch (error) {
        throw error;
    }
};


/**
 * Function to get by id
 * @param {*} params
 * @param {*} query
 * @returns
 */
module.exports.acceptRequest = async (user, body) => {
    console.log(user._id)
    try {
        let msg = ""
        if (body.followStatus == constants.FOLLOW_STATUS.ACCEPT) { msg = MSG.REQUEST_ACCEPT }
        if (body.followStatus == constants.FOLLOW_STATUS.REJECT) { msg = MSG.REQUEST_DELETED }

        let result = await dbHelper.findOneAndUpdate(Model.Follow, {
            followTo: user._id,
            _id: ObjectId(body._id),
            followStatus: constants.FOLLOW_STATUS.PENDING
        }, { followStatus: body.followStatus },
            { new: true })
        if (!result) throw new Error(MSG.INVALID_DATA);
        return { data: result, message: msg };
    } catch (error) {
        console.log("error ", error)
        throw error;
    }
}
/**
 * Function to get by id
 * @param {*} params
 * @param {*} query
 * @returns
 */
module.exports.myFollowers = async (user) => {
    try {
        const result = await Model.Follow.aggregate([
            {
                $match: {
                    isDeleted: false,
                    followTo: user._id,
                    followStatus: constants.FOLLOW_STATUS.ACCEPT
                }
            },
            {
                $lookup: {
                    from: "users",
                    let: { id: "$followFrom" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$id"] }
                            }
                        }
                    ],
                    as: "follower"
                }
            },
            {
                $unwind: {
                    path: "$follower",
                    preserveNullAndEmptyArrays: false
                }
            },
            {
                $project: {
                    "_id": 0,
                    "follower.email": 1,
                    "follower.isEmailVerified": 1,
                    "follower.phone": 1,
                    "follower.isPhoneVerified": 1,
                    "follower.userName": 1,
                    "follower.socialAccount": 1,
                    "follower.dob": 1,
                    "follower.image": 1
                }
            }
        ]);

        const followers = result.map(item => item.follower);
        const followersCount = followers.length;

        if (followersCount === 0) {
            throw new Error(MSG.NO_USER_FOLLOWER);
        }

        return {
            data: {
                followers,
                followersCount
            },
            message: MSG.DATA_FETCHED
        };
    } catch (error) {
        throw error;
    }
};

module.exports.following = async (user) => {
    try {
        const result = await Model.Follow.aggregate([
            {
                $match: {
                    isDeleted: false,
                    followFrom: user._id,
                    followStatus: constants.FOLLOW_STATUS.ACCEPT
                }
            },
            {
                $lookup: {
                    from: "users",
                    let: { id: "$followTo" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$id"] }
                            }
                        }
                    ],
                    as: "following"
                }
            },
            {
                $unwind: {
                    path: "$following",
                    preserveNullAndEmptyArrays: false
                }
            },
            {
                $project: {
                    "_id": 0,
                    "following.email": 1,
                    "following.isEmailVerified": 1,
                    "following.phone": 1,
                    "following.isPhoneVerified": 1,
                    "following.userName": 1,
                    "following.socialAccount": 1,
                    "following.dob": 1,
                    "following.image": 1
                }
            }
        ]);

        const following = result.map(item => item.following);
        const followingCount = following.length;

        if (followingCount === 0) {
            throw new Error(MSG.NO_FOLLOWING);
        }

        return {
            data: {
                following,
                followingCount
            },
            message: MSG.DATA_FETCHED
        };
    } catch (error) {
        throw error;
    }
};


