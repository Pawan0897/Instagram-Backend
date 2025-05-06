const express = require('express');
const router = express.Router();
/**
 * Function to create
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const follow = async (req, res, next) => {
  try {
    const { data, message } = await Services.follow.followRequestSend(req.user,req.body);
    return res.success(message, data);
  } catch (err) {
    next(err);
  }
};
/**
 * Function to get by id
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const acceptRejected = async (req, res, next) => {
  try {
    const { data, message } = await Services.follow.acceptRequest(req.user,req.body);
    return res.success(message, data);
  } catch (err) {
    next(err);
  }
};
/**
 * Function to get by id
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const myFollowers = async (req, res, next) => {
  try {
    const { data, message } = await Services.follow.myFollowers(req.user);
    return res.success(message, data);
  } catch (err) {
    next(err);
  }
};


const following = async (req, res, next) => {
  try {
    const { data, message } = await Services.follow.following(req.user);
    return res.success(message, data);
  } catch (err) {
    next(err);
  }
};


/**
 * @swagger
 * /follow:
 *
 *  post:
 *    summary: Create
 *
 *    tags:
 *      - FOLLOW
 *
 *    security:
 *      - bearerAuth: []
 *
 *    parameters:
 *      - in: header
 *        name: x-portal
 *        required: true
 *        description: Specifies the portal type. Valid options are `user`.
 *        schema:
 *          type: string
 *          enum:
 *            - user
 *
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/followfollowrequest'
 *
 *    responses:
 *      200:
 *        description: Success
 *      400:
 *        description: Bad request
 *      401:
 *        description: Unauthorized
 */
router.post("/",Auth.verify("user"),Validator(Validations.Follow.followrequest),follow);

/**
 * @swagger
 * /follow/accept-reject:
 *
 *  post:
 *    summary: accept-reject
 *
 *    tags:
 *      - FOLLOW
 *
 *    security:
 *      - bearerAuth: []
 *
 *    parameters:
 *      - in: header
 *        name: x-portal
 *        required: true
 *        description: Specifies the portal type. Valid options are `user`.
 *        schema:
 *          type: string
 *          enum:
 *            - user
 *
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/followacceptReject'
 *
 *    responses:
 *      200:
 *        description: Success
 *      400:
 *        description: Bad request
 *      401:
 *        description: Unauthorized
 */
router.post("/accept-reject",Auth.verify("user"),Validator(Validations.Follow.acceptReject),acceptRejected);

/**
 * @swagger
 * /follow/myFollowers:
 *
 *  get:
 *    summary: myFollowers
 *
 *    tags:
 *      - FOLLOW
 *
 *    security:
 *      - bearerAuth: []
 *
 *    parameters:
 *      - in: header
 *        name: x-portal
 *        required: true
 *        description: Specifies the portal type. Valid options are `user`.
 *        schema:
 *          type: string
 *          enum:
 *            - user
 *    responses:
 *      200:
 *        description: Success
 *      400:
 *        description: Bad request
 *      401:
 *        description: Unauthorized
 */
router.get("/myFollowers",Auth.verify("user"),myFollowers);

/**
 * @swagger
 * /follow/following:
 *
 *  get:
 *    summary: Following Listing
 *
 *    tags:
 *      - FOLLOW
 *
 *    security:
 *      - bearerAuth: []
 *
 *    parameters:
 *      - in: header
 *        name: x-portal
 *        required: true
 *        description: Specifies the portal type. Valid options are `user`.
 *        schema:
 *          type: string
 *          enum:
 *            - user
 *    responses:
 *      200:
 *        description: Success
 *      400:
 *        description: Bad request
 *      401:
 *        description: Unauthorized
 */
router.get("/following",Auth.verify("user"),following);













module.exports = router;