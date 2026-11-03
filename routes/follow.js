/**************** mounted on /follow */
const express = require("express");
const router = express.Router();
const { follow, acceptRejected, myFollowers, following, pendingRequests, status } = require("../Controller/follow");
const { verify } = require("../Midleware/auth");
const Validator = require("../Midleware/validator");
const Validation = require("../Validation/follow");

/**************** Follow / unfollow */
router.post("/", verify("user"), Validator(Validation.followrequest), follow);

/**************** Accept / reject follow request */
router.post("/accept-reject", verify("user"), Validator(Validation.acceptReject), acceptRejected);

/**************** My followers */
router.get("/myFollowers", verify("user"), myFollowers);

/**************** Current relationship with a profile */
router.get("/status/:id", verify("user"), status);

/**************** Pending requests received by me */
router.get("/requests", verify("user"), pendingRequests);

/**************** People I follow */
router.get("/following", verify("user"), following);

module.exports = router;
