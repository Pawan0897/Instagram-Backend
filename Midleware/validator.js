/**************** usage : router.post("/x", Validator(Schema), controller) */
module.exports = (schema, property = "body") => {
  if (!schema || typeof schema.validate !== "function") {
    throw new Error("Invalid schema provided for validation middleware.");
  }

  return (req, res, next) => {
    const dataToValidate = req[property];

    // Check if data exists before validation
    if (!dataToValidate || typeof dataToValidate !== "object") {
      return res.status(422).json({
        status: "error",
        message: `Missing or invalid data in request ${property}`,
        errors: [],
      });
    }

    // Validate request data using Joi
    const { error } = schema.validate(dataToValidate, { abortEarly: false });

    if (error) {
      // schemas with .error(new Error("...")) give a plain error without details
      if (!error.details) {
        return res.status(400).json({
          status: "error",
          message: error.message,
          errors: [],
        });
      }

      const errors = error.details.map((err) => ({
        field: err.path.join("."), // nested field names like "user.email"
        message: err.message.replace(/["]/g, ""), // remove extra quotes
      }));

      return res.status(400).json({
        status: "error",
        message: "Validation error",
        errors,
      });
    }

    next(); // Pass control to the next middleware/controller
  };
};
