const { ADDRESS } = require("../Modal/address");

/**************** Save address */
const addressSave = async (req, res, next) => {
  try {
    const data = await ADDRESS.create(req.body);
    return res.success("data save successfully", data);
  } catch (error) {
    console.log("error in address controller ", error);
    next(error);
  }
};

module.exports = { addressSave };
