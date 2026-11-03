const Joi = require("./Joi");

/**
 * Validation for admin login
 */
module.exports.login = Joi.object({
  email: Joi.string().email().required().description("email of the admin"),
  password: Joi.string().required().description("password of the admin"),
});

module.exports.logout = Joi.object({});
