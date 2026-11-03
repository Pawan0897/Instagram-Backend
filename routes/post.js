/**************** mounted on /post */
const express = require("express");
const router = express.Router();
const { create, list, myPost, getById, update, deleted } = require("../Controller/post");
const { verify } = require("../Midleware/auth");
const Validator = require("../Midleware/validator");
const { uploads } = require("../Midleware/multer");
const Validation = require("../Validation/post");

/**************** Create post (form-data key: import_posts) */
router.post("/create-post", verify("user"), uploads, create);

/**************** Feed */
router.get("/", verify("user"), list);

/**************** My posts (keep above "/:id") */
router.get("/myPost", verify("user"), myPost);

/**************** Post by id */
router.get("/:id", verify("user"), getById);

/**************** Update post */
router.put("/:id", verify("user"), uploads, update);

/**************** Delete post */
router.delete("/", verify("user"), Validator(Validation.deleted), deleted);

module.exports = router;
