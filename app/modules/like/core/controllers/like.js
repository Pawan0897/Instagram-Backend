const express = require('express');
const router = express.Router();
/**
 * Function to create
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const create = async (req, res, next) => {
  try {
    const { data, message } = await Services.like.create(req.user,req.body);
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
const likeCount = async (req, res, next) => {
  try {
    const { data, message } = await Services.like.likeCount(req.params, req.query);
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
const likeByMe = async (req, res, next) => {
  try {
    const { data, message } = await Services.like.likeByMe(req.user,req.params, req.query);
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
const myLikedPost = async (req, res, next) => {
  try {
    const { data, message } = await Services.like.myLikedPost(req.user);
    return res.success(message, data);
  } catch (err) {
    console.log(err)
    next(err);
  }
};
/**
 * Function to get by id
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const likeUserListing = async (req, res, next) => {
  try {
    const { data, message } = await Services.like.likeUserListing(req.user,req.params, req.query);
    return res.success(message, data);
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /like/myLikedPost/:
 *
 *  get:
 *    summary: Like Post by Me
 *
 *    tags:
 *      - LIKE
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
router.get("/mylikedPost",Auth.verify("user"),myLikedPost);

/**
 * @swagger
 * /like:
 *
 *  post:
 *    summary: Create
 *
 *    tags:
 *      - LIKE
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
 *            $ref: '#/components/schemas/likecreate'
 *
 *    responses:
 *      200:
 *        description: Success
 *      400:
 *        description: Bad request
 *      401:
 *        description: Unauthorized
 */
router.post("/",Auth.verify("user"),Validator(Validations.Like.create),create);
/**
 * @swagger
 * /like/{id}:
 *
 *  get:
 *    summary: Like Count
 *
 *    tags:
 *      - LIKE
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
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: string
 *
 *    responses:
 *      200:
 *        description: Success
 *      400:
 *        description: Bad request
 *      401:
 *        description: Unauthorized
 */
router.get("/:id",Auth.verify("user"),likeCount);
/**
 * @swagger
 * /like/likeByMe/{id}:
 *
 *  get:
 *    summary: Like By Me
 *
 *    tags:
 *      - LIKE
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
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: string
 *
 *    responses:
 *      200:
 *        description: Success
 *      400:
 *        description: Bad request
 *      401:
 *        description: Unauthorized
 */
router.get("/likeByMe/:id",Auth.verify("user"),likeByMe);
/**
 * @swagger
 * /like/likeUserListing/{id}:
 *
 *  get:
 *    summary: Like User Listing
 *
 *    tags:
 *      - LIKE
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
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: string
 *
 *    responses:
 *      200:
 *        description: Success
 *      400:
 *        description: Bad request
 *      401:
 *        description: Unauthorized
 */
router.get("/likeUserListing/:id",Auth.verify("user"),likeUserListing);



module.exports = router;