/**************** mounted on /address */
const express = require("express");
const router = express.Router();
const { addressSave } = require("../Controller/address");

/**************** Save address */
router.post("/addresses", addressSave);

module.exports = router;
