const Joi = require("./Joi");

module.exports.create = Joi.object({
  postId: Joi.string().required(),
});
