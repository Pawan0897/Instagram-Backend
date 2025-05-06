
const postSchema = new Mongoose.Schema(
    {
        post: {
            type: String,
        },
        video: {
            type: String
        },
        caption: {
            type: String
        },
        audio: {
            type: String
        },
        userId: {
            type: Mongoose.Schema.Types.ObjectId,
            ref: "users",
        },
        isDeleted: {
            type: Boolean,
            default: false,
        }
    }, { timestamps: true }
);

module.exports = Mongoose.model("posts", postSchema);


module.exports.list = (filter, skip, limit) => {
   

    const pipeline = [];
    const addFields = {};
    const qry = {
        isDeleted: false,
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
            {caption:searchRegex}
        ];
    }
    pipeline.push(
        { $match: qry },
        { $sort: { createdAt: -1 } }
    );
    pipeline.push(
        {
            $project: {
                isDeleted:0,
                
            }
        }
    );
    if (skip !== undefined && limit !== undefined) {
        pipeline.push(...Func.pagination(skip, limit));
    }
    return dbHelper.aggregate(Model.Post, pipeline).then(res => {
        if (skip !== undefined && limit !== undefined) {
            return res[0]
        }
        return res;
    });
};






