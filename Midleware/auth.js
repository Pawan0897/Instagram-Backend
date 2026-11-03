const jwt = require("jsonwebtoken");
const constants = require("../CommonFunction/Constants");
const MSG = require("../CommonFunction/Messages");
const { SESSIONS } = require("../Modal/sessions");
const { ACCESS_ROLE } = require("../Modal/accessRole");
require("../Modal/user"); // registers the "users" model used by populate("userId")

const jwtSecret = () => process.env.jwt_secret || "";

/**************** token for logged in user. portal = "user" | "staff" | "admin" */
const getToken = (data, portal = "user") => {
  data.role = portal === "staff" ? "staff" : portal === "admin" ? "admin" : "user";

  return jwt.sign(data, jwtSecret(), {
    expiresIn: "24h",
  });
};

/**************** temp token (expiry from env app_token_expires_time) */
const getVerifyToken = (data) =>
  jwt.sign(data, jwtSecret(), {
    expiresIn: process.env.app_token_expires_time || "24h",
  });

const verifyToken = (token) => jwt.verify(token, jwtSecret());

const unauthorized = (res, message = MSG.UNAUTHORIZED_ACCESS) =>
  res.status(401).send({
    statusCode: 401,
    message,
    data: {},
    status: 0,
    isSessionExpired: true,
  });

/**
 * Middleware : verify jwt + session + role
 * @param {...string} args - allowed roles e.g. verify("user") / verify("admin", "sub_admin")
 * sets : req.user (or req.admin), req.session, req.userId, req.decoded
 */
const verify =
  (...args) =>
  async (req, res, next) => {
    try {
      // roles passed as arguments -> numbers from constants.ROLE
      const roles = []
        .concat(args)
        .filter((role) => !!role && !!role.toString().trim())
        .map((role) => constants.ROLE[role.toUpperCase()])
        .filter((role) => !!role);

      const token = String(req.headers.authorization || "")
        .replace(/bearer|jwt|Guest/i, "")
        .trim();

      if (!token) {
        console.error("No token");
        return unauthorized(res);
      }

      const decoded = verifyToken(token);

      if (!decoded) {
        console.error("Token decode failed", token);
        return unauthorized(res);
      }

      const doc = await SESSIONS.findById(decoded._id).populate("userId");

      if (!doc) {
        console.error("Token user not found", decoded);
        return unauthorized(res);
      }

      if (doc.userId.isBlocked) {
        console.error("User is blocked", doc.userId);
        return unauthorized(res, MSG.ACCOUNT_BLOCKED);
      }

      if (!roles.includes(doc.userId.role)) {
        console.error("Access role not match", {
          expected: roles.join(", "),
          found: doc.userId.role,
        });
        return unauthorized(res);
      }

      // after forget password the token can only be used on /change-password
      if (decoded.isForget) {
        const whitelistPath = ["/change-password"];

        if (!whitelistPath.includes(req.url)) {
          return unauthorized(res);
        }
        req.body.resetPassword = true;
      }

      const role = roles.includes(constants.ROLE.ADMIN) ? "admin" : "user";

      // attach session, userId and user data to the request
      req[role] = doc.userId.toJSON({ virtuals: true });
      req.session = doc.toJSON({ virtuals: true });
      req.userId = doc.userId._id;
      req.decoded = doc.userId.toJSON({ virtuals: true });

      next();
    } catch (error) {
      console.error(error);
      const message =
        String(error.name).toLowerCase() == "error" ? error.message : MSG.UNAUTHORIZED_ACCESS;

      return res.error(401, message);
    }
  };

/**
 * Middleware : sub-admin permission check (admin always passes)
 * @param {string} apiType - "get" | "add" | "edit" | "delete"
 * @param {...number} sideBarIds - constants.MODULES ids
 */
const checkSubAdmin =
  (apiType, ...sideBarIds) =>
  async (req, res, next) => {
    try {
      if (![constants.ROLE.SUB_ADMIN].includes(req.decoded.role)) {
        return next();
      }

      const qry = {
        sideBarId: { $in: sideBarIds.map((item) => Number(item)) },
      };

      if (apiType == "get") {
        qry.isView = true;
      } else {
        qry.isView = true;

        if (apiType == "delete") {
          qry.isDelete = true;
        } else if (apiType == "add") {
          qry.isAdd = true;
        } else if (apiType == "edit") {
          qry.isEdit = true;
        }
      }

      const checkPermission = await ACCESS_ROLE.aggregate([
        {
          $match: {
            _id: req.decoded.accessRole,
            permission: {
              $elemMatch: qry,
            },
          },
        },
      ]);

      if (checkPermission.length > 0) {
        return next();
      }

      const error = new Error(MSG.ACCESS_DENIED);
      error.status = 403;
      return next(error);
    } catch (error) {
      return next(error);
    }
  };

module.exports = { getToken, getVerifyToken, verifyToken, verify, checkSubAdmin };
