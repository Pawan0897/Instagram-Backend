const Joi = require("joi").defaults((schema) => {
    switch (schema.type) {
      case "string":
        return schema.replace(/\s+/, " ");
      default:
        return schema;
    }
  });

  Joi.objectId = () => Joi.string().pattern(/^[0-9a-f]{24}$/, "valid ObjectId");

  module.exports.commentCreate = Joi.object({
    text:Joi.string().required(),
    userId:Joi.string().optional(),
    postId:Joi.string().required(),
  })

  module.exports.commentUpdate = Joi.object({
    text:Joi.string().optional(),
    userId:Joi.string().optional(),
    commentId:Joi.string().required(),
  })