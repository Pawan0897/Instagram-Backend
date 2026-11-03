const Joi = require("./Joi");

/**
 * Validation for cms edit
 */
module.exports.update = Joi.object({
  email: Joi.string().email().optional(),
  countryCode: Joi.string().optional(),
  phone: Joi.string().optional(),
  terms: Joi.string().optional(),
  terms_ar: Joi.string().optional(),
  privacyPolicy: Joi.string().optional(),
  privacyPolicy_ar: Joi.string().optional(),
  aboutUs: Joi.string().optional(),
  aboutUs_ar: Joi.string().optional(),
});
