const Joi = require("./Joi");

module.exports.commentCreate = Joi.object({
  text: Joi.string().required(),
  userId: Joi.string().optional(),
  postId: Joi.string().required(),
});

module.exports.commentUpdate = Joi.object({
  text: Joi.string().optional(),
  userId: Joi.string().optional(),
  commentId: Joi.string().required(),
});
