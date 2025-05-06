const Joi = require("joi").defaults((schema) => {
    switch (schema.type) {
        case "string":
            return schema.replace(/\s+/, " ");
        default:
            return schema;
    }
});
Joi.objectId = () => Joi.string().pattern(/^[0-9a-f]{24}$/, "valid ObjectId");

module.exports.create = Joi.object({
    caption: Joi.string().optional(),
})
module.exports.update = Joi.object({
    postId: Joi.string().required(),
    post: Joi.string().required(),
    caption: Joi.string().optional(),
})
module.exports.deleted = Joi.object({
    postId: Joi.string().required(),
})






