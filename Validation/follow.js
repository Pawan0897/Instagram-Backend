const Joi = require("./Joi");
const constants = require("../CommonFunction/Constants");

module.exports.followrequest = Joi.object({
  followTo: Joi.string().required(),
});
module.exports.acceptReject = Joi.object({
  _id: Joi.string().required(),
  followStatus: Joi.number()
    .required()
    .valid(...Object.values(constants.FOLLOW_STATUS)),
});
