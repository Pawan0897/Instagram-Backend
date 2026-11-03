const { ACCESS_ROLE } = require("../Modal/accessRole");
const { USER } = require("../Modal/user");
const constants = require("../CommonFunction/Constants");
const MSG = require("../CommonFunction/Messages");
const { PAGINATION_LIMIT } = require("../CommonFunction/Functions");

/**************** Create access role */
const create = async (req, res, next) => {
  try {
    const result = await new ACCESS_ROLE(req.body).save();
    return res.success(MSG.DATA_SUBMITED_SUCCESSFULLY, result);
  } catch (err) {
    next(err);
  }
};

/**************** List access roles (page, limit) */
const list = async (req, res, next) => {
  try {
    const query = req.query;
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : PAGINATION_LIMIT;
    const skip = Number((page - 1) * limit);

    let result = await ACCESS_ROLE.list(query, skip, limit);

    if (!result) {
      result = {
        list: [],
        totalCount: 0,
      };
    }

    result.totalPages = Math.ceil(result.totalCount / limit);

    return res.success(MSG.DATA_FETCHED, result);
  } catch (err) {
    next(err);
  }
};

/**************** Get access role by id */
const getById = async (req, res, next) => {
  try {
    const result = await ACCESS_ROLE.findOne({ _id: req.params.id, isDeleted: false });
    return res.success(MSG.DATA_FETCHED, result);
  } catch (err) {
    next(err);
  }
};

/**************** Update access role by id */
const updateById = async (req, res, next) => {
  try {
    const result = await ACCESS_ROLE.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true },
    );
    if (!result) throw new Error(MSG.INVALID_ID);

    return res.success(MSG.UPDATED_SUCCESSFULLY, result);
  } catch (err) {
    next(err);
  }
};

/**************** Delete access role by id (not allowed while a sub-admin uses it) */
const deleteById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await ACCESS_ROLE.findOne({ _id: id, isDeleted: false });
    if (!result) throw new Error(MSG.INVALID_ID);

    const subadmin = await USER.findOne({
      isDeleted: false,
      role: constants.ROLE.SUB_ADMIN,
      accessRole: id,
    });
    if (subadmin) throw new Error(MSG.ROLE_IN_USE);

    result.isDeleted = true;

    await result.save();

    return res.success(MSG.DELETED_SUCCESSFULLY);
  } catch (err) {
    next(err);
  }
};

module.exports = { create, list, getById, updateById, deleteById };
