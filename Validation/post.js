const Joi = require("./Joi");

module.exports.create = Joi.object({
  caption: Joi.string().optional(),
});
module.exports.update = Joi.object({
  postId: Joi.string().required(),
  post: Joi.string().required(),
  caption: Joi.string().optional(),
});
module.exports.deleted = Joi.object({
  postId: Joi.string().required(),
});
