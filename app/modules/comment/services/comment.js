module.exports.commentCreate = async (user, body) => {
    try {
        const postValid = await dbHelper.findOne(Model.Post, { _id: body.postId, isDeleted: false })
        if (!postValid) { throw new Error(MSG.USER_INVITED_SUCCESSFULLY) }

        body.userId=user._id
    
        const commentSave = await dbHelper.create(Model.Comment,  body)
        return {
            data: commentSave,
            message: "comment successfuly"
        }
    } catch (error) {
        console.log("error ha bhai commentCreate services ma ",error)
        throw error
    }
};


module.exports.commentListing = async (user, params) => {
    try {
        const postId = new Mongoose.Types.ObjectId(params.id);
        const userId = user._id;
        const data = await Model.Comment.find({postId:postId,isDeleted:false})

        return {
            data: data,
            message: "Data fetched successfully"
        };
    } catch (error) {
        console.log("Error in commentListing function: ", error);
        throw error;
    }
};


module.exports.commentUpdate = async (user,body) =>{
    try {
        const userId = user._id
        const commentId = new Mongoose.Types.ObjectId(body.commentId)
        const updatedComment = await Model.Comment.findOneAndUpdate(
            { _id: commentId, userId: userId },{text:body.text},
            { new: true } 
        );
        if(!updatedComment){throw new Error("userId or postId not match")}
        
        return {
            data:updatedComment,
            message:"data update successfuly"
        }
    } catch (error) {
        console.log("error in commentUpdate function ",error)
        throw error
    }
}

module.exports.commentDeleted = async (user,params) => {
    try {
        const userId = user._id
        const commentId = new Mongoose.Types.ObjectId(params.id)
        console.log("userId and paramsID ",userId,commentId)
        const deletedComment = await Model.Comment.findOneAndUpdate(
            { _id: commentId, userId: userId },
            { isDeleted: true },
            { new: true }
        );        if(!deletedComment){throw new Error("user id or comment id missing ")}
        return {
            message:"Comment deleted successfuly",
            data:deletedComment
        }
    } catch (error) {
        console.log("error in commentDeleted function ",error)
        throw error
    }
}