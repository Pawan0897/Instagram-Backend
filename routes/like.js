/**************** mounted on /like */
const express = require("express");
const router = express.Router();
const { create, likeCount, likeByMe, likeUserListing, myLikedPost } = require("../Controller/like");
const { verify } = require("../Midleware/auth");
const Validator = require("../Midleware/validator");
const Validation = require("../Validation/like");

/**************** Posts liked by me (keep above "/:id") */
router.get("/mylikedPost", verify("user"), myLikedPost);

/**************** Like / unlike a post */
router.post("/", verify("user"), Validator(Validation.create), create);

/**************** Like count of a post (:id = postId) */
router.get("/:id", verify("user"), likeCount);

/**************** Did I like this post */
router.get("/likeByMe/:id", verify("user"), likeByMe);

/**************** Users who liked this post */
router.get("/likeUserListing/:id", verify("user"), likeUserListing);

module.exports = router;
