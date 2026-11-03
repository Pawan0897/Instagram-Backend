const { COMMENT } = require("../Modal/comment");
const { POST } = require("../Modal/post");
const MSG = require("../CommonFunction/Messages");
const { ObjectId } = require("../CommonFunction/Functions");

/**************** Comment on a post */
const commentCreate = async (req, res, next) => {
  try {
    const body = req.body;
    const postValid = await POST.findOne({ _id: body.postId, isDeleted: false });
    if (!postValid) {
      throw new Error(MSG.POST_ID_NOT_FOUND);
    }

    body.userId = req.user._id;

    const commentSave = await new COMMENT(body).save();
    return res.success("comment successfuly", commentSave);
  } catch (error) {
    console.log("error in commentCreate", error);
    next(error);
  }
};

/**************** All comments of a post (:id = postId) */
const commentListing = async (req, res, next) => {
  try {
    const postId = ObjectId(req.params.id);
    const data = await COMMENT.find({ postId: postId, isDeleted: false });

    return res.success("Data fetched successfully", data);
  } catch (error) {
    console.log("error in commentListing", error);
    next(error);
  }
};

/**************** Edit own comment */
const commentUpdate = async (req, res, next) => {
  try {
    const body = req.body;
    const commentId = ObjectId(body.commentId);
    const updatedComment = await COMMENT.findOneAndUpdate(
      { _id: commentId, userId: req.user._id },
      { text: body.text },
      { new: true },
    );
    if (!updatedComment) {
      throw new Error("userId or postId not match");
    }

    return res.success("data update successfuly", updatedComment);
  } catch (error) {
    console.log("error in commentUpdate", error);
    next(error);
  }
};

/**************** Delete own comment (soft delete) */
const commentDelete = async (req, res, next) => {
  try {
    const commentId = ObjectId(req.params.id);
    const deletedComment = await COMMENT.findOneAndUpdate(
      { _id: commentId, userId: req.user._id },
      { isDeleted: true },
      { new: true },
    );
    if (!deletedComment) {
      throw new Error("user id or comment id missing ");
    }

    return res.success("Comment deleted successfuly", deletedComment);
  } catch (error) {
    console.log("error in commentDelete", error);
    next(error);
  }
};

module.exports = { commentCreate, commentListing, commentUpdate, commentDelete };
