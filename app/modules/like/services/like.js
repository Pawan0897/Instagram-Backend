/**
 * Function to create
 * @param {*} body
 * @returns
 */
module.exports.create = async (user, body) => {
    try {
        console.log(body)
        body.userId = user._id
        body.postId = new Mongoose.Types.ObjectId(body.postId);
        console.log(body)

        let checkPost = await dbHelper.findOne(Model.Post, {
             _id: body.postId,
             isDeleted: false 
            })

        if (!checkPost)
           { throw new Error(MSG.POST_ID_NOT_FOUND); }

        let existLiked = await Model.Like.findOneAndDelete({
             postId: body.postId,
             userId: body.userId
             })

        if (existLiked) {
            return { data: null, message: MSG.UNLIKED_SUCCESSFULLY };
        }


        let result = await dbHelper.create(Model.Like, body)

        if (!result) throw new Error(MSG.NOT_FOUND);

        return { data: result, message: MSG.LIKED_SUCCESSFULLY };

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
module.exports.likeCount = async (params, query) => {
    try {
        const user = await Model.Post.aggregate([
            {
                $match:
                    { _id: ObjectId(params.id), isDeleted: false }
            },
            {
                $lookup: {
                    from: "likes",
                    let: { id: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$postId", "$$id"]
                                }
                            }
                        },
                    ],
                    as: "likeDetails"
                }
            },
            {
                $addFields: {
                    likeCount: { $size: "$likeDetails" }
                }
            }
        ]);

        if (!user.length) { throw new Error(MSG.POST_ID_NOT_FOUND); }

        return {
             data: user,
             message: MSG.DATA_FETCHED
             };
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
module.exports.likeByMe = async (user, params, query) => {
    try {
        let result = await dbHelper.find(Model.Like, {
             userId: user._id,
             postId: ObjectId(params.id) 
            },)

        if (!result) { throw new Error(MSG.YOU_NOT_LIKED_POST); }

        return {
             data: result,
             message: MSG.POST_LIKED_BY_YOU
             };

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
module.exports.likeUserListing = async (user, params, query) => {
    try {
        const user = await Model.Like.aggregate([
            {
                $match:
                    { postId: ObjectId(params.id) }
            },
            {
                $lookup: {
                    from: "users",
                    let: { id: "$userId" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", "$$id"]
                                }
                            }
                        },
                    ],
                    as: "userDetails"
                }
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
                }
            },
            {
                $addFields: {
                    likeCount: { $size: "$userDetails" }
                }
            }
        ]);

        if (!user.length) { throw new Error(MSG.POST_ID_NOT_FOUND); }

        return { 
            data: user,
            message: MSG.DATA_FETCHED 
        };
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
module.exports.myLikedPost = async (user) => {
    try {
        let result = await Model.Like.find({
             userId: user._id 
            },).populate('postId', 'post');

        return { 
            data: result, 
            message: MSG.DATA_FETCHED 
        };
    } catch (error) {
        console.log('error ', error)
        throw error;
    }
};






