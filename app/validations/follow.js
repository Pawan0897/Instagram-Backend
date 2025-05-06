const Joi = require("joi").defaults((schema) => {
    switch (schema.type) {
        case "string":
            return schema.replace(/\s+/, " ");
        default:
            return schema;
    }
});
Joi.objectId = () => Joi.string().pattern(/^[0-9a-f]{24}$/, "valid ObjectId");

module.exports.followrequest = Joi.object({
    followTo: Joi.string().required(),
})
module.exports.acceptReject = Joi.object({
    _id: Joi.string().required(),
    followStatus: Joi.number().required().valid(...Object.values(constants.FOLLOW_STATUS))
})









