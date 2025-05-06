/**
 * Function to create
 * @param {*} body
 * @returns
 */
module.exports.create = async (user, file, body) => {
    try {
        body.post = `http://localhost:1802/images/${file.filename}`
        body.userId = user._id
        let result = await dbHelper.create(Model.Post, body)
        if (!result) throw new Error(MSG.NOT_FOUND);
        return { data: result, message: MSG.CREATE_SUCCESSFULLY };
    } catch (error) {
        console.log('error: ', error);
        throw error;
    }
};

/**
 * Function to list
 * @param {*} query
 * @returns
 */
// module.exports.list = async (query) => {
//     try {
       
//         const page = query.page ? Number(query.page) : 1;
//         const limit = query.limit ? Number(query.limit) : pagination_limit;
//         const skip = Number((page - 1) * limit);
//         let result;
//         if (query.isAll == 'true') {
//             result = await dbHelper.find(Model.Post, { isDeleted: false },
//                 { caption: 1, post: 1, },
//                 { sort: { createdAt: -1 }, lean: true });
//             console.log(result)
//         } else {
//             result = await Model.Post.list(query, skip, limit);
//             if (!result) {
//                 result = {
//                     list: [],
//                     totalCount: 0,
//                 }
//             }
//             result.totalPages = Math.ceil(result.totalCount / limit);
//         }
//         return { data: result, message: MSG.DATA_FETCHED };
//     } catch (error) {
//         throw error;
//     }
// };



module.exports.feed = async (user, query = {}) => {
    try {
        console.log("User ID:", user._id);
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const skip = (page - 1) * limit;
        const followedUserIds = await Model.Follow.find({
            followFrom: user._id,
            followStatus: constants.FOLLOW_STATUS.ACCEPT,
            isDeleted: false
        }).distinct("followTo");
        followedUserIds.push(user._id);
        const result = await Model.Post.aggregate([
            {
                $match: {
                    isDeleted: false,
                    userId: { $in: followedUserIds }
                }
            },
            {
                $lookup: {
                    from: "users", 
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: "$user"
            },
            {
                $project: {
                    post: 1,      
                    createdAt: 1,
                    userId: 1,
                    "user.userName": 1     
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            { $skip: skip },
            { $limit: limit }
        ]);
        
        return {
            data: result,
            page,
            limit,
            message: MSG.DATA_FETCHED
        };
    } catch (err) {
        console.error("Feed error:", err);
        throw err;
    }
};

/**
 * Function to get by id
 * @param {*} params
 * @param {*} query
 * @returns
 */
module.exports.myPost = async ( user) => {
    try {
        let qry = { userId: user._id, isDeleted: false,  };
        const result = await dbHelper.find(Model.Post, qry)
        if (!result) throw new Error(MSG.INVALID_ID);
        return { data: result, message: MSG.DATA_FETCHED };
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
module.exports.getById = async (params, query) => {
    try {
        let qry = { _id: params.id, isDeleted: false};
        const result = await dbHelper.findOne(Model.Post, qry).populate([
            { path: 'userId', select: 'userName email city country phone  email dob' },
        ]);
        if (!result) throw new Error(MSG.INVALID_ID);
        if (result) { result.password = undefined }
        return { data: result, message: MSG.DATA_FETCHED };
    } catch (error) {
        throw error;
    }
};

/**
 * Function to update by id
 * @param {*} params
 * @param {*} body
 * @returns
 */
module.exports.update = async (user, file, body, params) => {
    try {
        body.post = `http://localhost:1802/images/${file.filename}`
        let data = await dbHelper.findOneAndUpdate(Model.Post, {
            _id: params.id, userId: user._id,
             isDeleted: false
        },
            body, { new: true })
        if (!data) throw new Error(MSG.NOT_FOUND);
        return { data: data, message: MSG.UPDATED_SUCCESSFULLY };
    } catch (error) {
        throw error;
    }
};
module.exports.deleted = async (user,body) => {
    try {
        let data = await dbHelper.findOneAndUpdate(Model.Post, {
            _id: body.postId,
            userId:user._id,
             isDeleted: false
        }, { isDeleted: true }, { new: true })
        if (!data) throw new Error(MSG.NOT_FOUND);
        return {data:"👺", message: MSG.DELETED_SUCCESSFULLY };
    } catch (err) {
        throw err
    }
}





















































// /**
//  * Function to update by id
//  * @param {*} params
//  * @param {*} body
//  * @returns
//  */
// module.exports.approval = async (body) => {
//     try {
//         let data = await dbHelper.findOneAndUpdate(Model.Post, {
//             _id: body.postId,
//             adminApproval: false, isDeleted: false
//         },
//             { adminApproval: true }, { new: true })
//         if (!data) throw new Error(MSG.NOT_FOUND);
//         return { data: data, message: MSG.UPDATED_SUCCESSFULLY };
//     } catch (error) {
//         throw error;
//     }
// };






