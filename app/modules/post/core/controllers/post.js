const express = require('express');
const router = express.Router();

const address = async (req,res,next) =>{
  const {data,message} = await  Services.post.address(req.body)
  return res.success(message,data)
}

/**
 * Function to create
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const create = async (req, res, next) => {
  try {
    console.log(req)
    const { data, message } = await Services.post.create(req.user, req.file, req.body);
    return res.success(message, data);
  } catch (err) {
    next(err);
  }
};
/**
 * Function to list
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const list = async (req, res, next) => {
  try {
    const { data, message } = await Services.post.feed(req.user);
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
const myPost = async (req, res, next) => {
  try {
    const { data, message } = await Services.post.myPost(req.user);
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
const getById = async (req, res, next) => {
  try {
    const { data, message } = await Services.post.getById(req.params, req.query);
    return res.success(message, data);
  } catch (err) {
    next(err);
  }
};
/**
 * Function to update by id
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const update = async (req, res, next) => {
  try {
    const { data, message } = await Services.post.update(req.user, req.file, req.body, req.params);
    return res.success(message, data);
  } catch (err) {
    next(err);
  }
};
/**
* Function to delete by id
* @param {*} req
* @param {*} res
* @param {*} next
*/
const deleted = async (req, res, next) => {
  try {
    const { data, message } = await Services.post.deleted(req.user,req.body);
    return res.success(message, data);
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /post/create-post:
 *
 *  post:
 *    summary: upload post
 *
 *    tags:
 *      - POST
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
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               import_posts:
 *                 type: string
 *                 format: binary
 *                 description: The media file to upload.
 *
 *
 *    responses:
 *      200:
 *        description: Success
 *      400:
 *        description: Bad request
 *      401:
 *        description: Unauthorized
 */
router.post( "/create-post", Auth.verify("user"), Services.Upload.uploads, create);
/**
 * @swagger
 * /post/:
 *
 *  get:
 *    summary: Listing
 *
 *    tags:
 *      - POST
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
 *      - in: query
 *        name: page
 *        description: Current page number
 *        schema:
 *          type: number
 *          example: 1
 *      - in: query
 *        name: limit
 *        description: Page size
 *        schema:
 *          type: number
 *          example: 10
 *    responses:
 *      200:
 *        description: Success
 *      400:
 *        description: Bad request
 *      401:
 *        description: Unauthorized
 */
router.get( "/", Auth.verify("user"), list);
/**
 * @swagger
 * /post/myPost:
 *
 *  get:
 *    summary:  My Post
 *
 *    tags:
 *      - POST
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
router.get("/myPost",Auth.verify("user"),myPost);
/**
 * @swagger
 * /post/{id}:
 *
 *  get:
 *    summary: Get By Id
 *
 *    tags:
 *      - POST
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
router.get("/:id",Auth.verify("user"),getById);
/**
 * @swagger
 * /post/{id}:
 *
 *  put:
 *    summary: Update Upload
 *
 *    tags:
 *      - POST
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
 *    requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               import_posts:
 *                 type: string
 *                 format: binary
 *                 description: The media file to upload.
 *
 *
 *    responses:
 *      200:
 *        description: Success
 *      400:
 *        description: Bad request
 *      401:
 *        description: Unauthorized
 */
router.put( "/:id", Auth.verify("user"), Services.Upload.uploads, update);
/**
 * @swagger
 * /post:
 *
 *  delete:
 *    summary: Delete
 *
 *    tags:
 *      - POST
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
 *      - in: header
 *        name: appkey
 *        required: false
 *        description: Specifies the appkey when you have to by pass encryption.
 *        schema:
 *          type: string
 *
 *    security:
 *      - bearerAuth: []
 *
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/postdeleted'
 *
 *    responses:
 *      200:
 *        description: Success
 *      400:
 *        description: Bad request
 *      401:
 *        description: Unauthorized
 */
router.delete("/",Auth.verify("user"), Validator(Validations.Post.deleted),deleted);

module.exports = router;