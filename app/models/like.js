const Schema = new Mongoose.Schema({
    isLiked: { type: Boolean, default: true, index: true },
    postId: { type: Mongoose.Schema.Types.ObjectId, ref: "posts" },
    userId: { type: Mongoose.Schema.Types.ObjectId, ref: "users" },
    isDeleted: { type: Boolean, default: false, index: true },
},
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });
// Pre-save hook to ensure 'isActive' is false when 'isDeleted' is true
module.exports = Mongoose.model('like', Schema);
module.exports.list = (filter, skip, limit) => {
    const pipeline = [];
    const addFields = {};
    const qry = {
        isDeleted: false,
    //    postId:filter.search
    };
    // Add search criteria
    if (filter?.search) {
        const trimmedSearch = filter.search.trim();
        const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
        const safeSearch = escapeRegex(trimmedSearch);
        const searchRegex = { $regex: safeSearch, $options: 'i' };
        qry.$or = [
            { post: searchRegex },
            { _id: searchRegex },
            { caption: searchRegex }
        ];
    }
    pipeline.push(
        { $match: qry },
        { $sort: { createdAt: -1 } }
    );
    pipeline.push(
        {
            $project: {
                isDeleted: 0,
                isBlocked: 0
            }
        }
    );
    if (skip !== undefined && limit !== undefined) {
        pipeline.push(...Func.pagination(skip, limit));
    }
    return dbHelper.aggregate(Model.Like, pipeline).then(res => {
        if (skip !== undefined && limit !== undefined) {
            return res[0]
        }
        return res;
    });
};






