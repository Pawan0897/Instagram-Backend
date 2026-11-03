/**************** Admin portal : mounted on /admin/access-role  (header x-portal: admin) */
const express = require("express");
const router = express.Router();
const { create, list, getById, updateById, deleteById } = require("../Controller/accessRole");
const { verify, checkSubAdmin } = require("../Midleware/auth");
const Validator = require("../Midleware/validator");
const constants = require("../CommonFunction/Constants");
const Validation = require("../Validation/accessRole");

/**************** Create access role */
router.post(
  "/",
  verify("admin", "sub_admin"),
  checkSubAdmin("add", constants.MODULES.subAdmin),
  Validator(Validation.create),
  create,
);

/**************** List access roles */
router.get(
  "/",
  verify("admin", "sub_admin"),
  checkSubAdmin("get", constants.MODULES.subAdmin),
  list,
);

/**************** Get access role by id */
router.get(
  "/:id",
  verify("admin", "sub_admin"),
  checkSubAdmin("get", constants.MODULES.subAdmin),
  getById,
);

/**************** Update access role by id */
router.put(
  "/:id",
  verify("admin", "sub_admin"),
  checkSubAdmin("edit", constants.MODULES.subAdmin),
  Validator(Validation.updateById),
  updateById,
);

/**************** Delete access role by id */
router.delete(
  "/:id",
  verify("admin", "sub_admin"),
  checkSubAdmin("delete", constants.MODULES.subAdmin),
  Validator(Validation.deleteById),
  deleteById,
);

module.exports = router;
