/**************** mounted on /comment */
const express = require("express");
const router = express.Router();
const {
  commentCreate,
  commentListing,
  commentUpdate,
  commentDelete,
} = require("../Controller/comment");
const { verify } = require("../Midleware/auth");
const Validator = require("../Midleware/validator");
const Validation = require("../Validation/comment");

/**************** Comment on a post */
router.post("/", verify("user"), Validator(Validation.commentCreate), commentCreate);

/**************** Comments of a post (:id = postId) */
router.get("/:id", verify("user"), commentListing);

/**************** Edit own comment */
router.put("/", verify("user"), Validator(Validation.commentUpdate), commentUpdate);

/**************** Delete own comment (:id = commentId) */
router.delete("/:id", verify("user"), commentDelete);

module.exports = router;
