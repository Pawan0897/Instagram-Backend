/**************** env must be loaded before the other files are required */
require("dotenv").config();

const express = require("express");
const createError = require("http-errors");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");
const helmet = require("helmet");
const path = require("path");

/******* Middlewares / common ********/
const { requestLogger, logger } = require("./Midleware/logger");
const encodeDecode = require("./Midleware/decryption");
const responseMiddleware = require("./Midleware/response");
const portal = require("./Midleware/portal");

/******* DB ********/
const { db_connection } = require("./db_connection/db");
const { migrate } = require("./db_connection/migration");

/******* Routes ********/
const user = require("./routes/user");
const post = require("./routes/post");
const like = require("./routes/like");
const comment = require("./routes/comment");
const follow = require("./routes/follow");
const address = require("./routes/address");
const adminRoute = require("./routes/admin");
const accessRole = require("./routes/accessRole");

/*************************** server */
const app = express();
const PORT = process.env.app_port || 3000;

/************************** body parsers (admin portal accepts bigger json) */
const jsonParser = express.json();
const adminJsonParser = express.json({ limit: "50mb" });
app.use((req, res, next) => {
  if (req.url.includes("/webhook")) {
    next();
  } else if (req.path.startsWith("/admin")) {
    adminJsonParser(req, res, next);
  } else {
    jsonParser(req, res, next);
  }
});
app.use(requestLogger);
app.use(compression());
app.use(helmet({
  crossOriginResourcePolicy: {
    policy: "cross-origin",
  },
}));

/************************** API encryption (only dev / prod / stag) */
if (["dev", "prod", "stag"].includes(process.env.NODE_ENV)) {
  app.use(async function (req, res, next) {
    if (
      (req.headers.appkey && req.headers.appkey == process.env.APPKEY) ||
      (await encodeDecode.withoutEncryptionApi(req))
    ) {
      next();
    } else {
      await encodeDecode.decrypWithSek(req, res, next);
    }
  });
}

/************************** res.success / res.error */
app.use(responseMiddleware);

/************************** http logs -> winston */
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()), // Send Morgan logs to Winston
    },
  }),
);

/************************** folder directory path for uploaded images */
app.use("/images", express.static(path.join(__dirname, "multerImages")));

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    exposedHeaders: ["x-access-token", "x-tenant"],
    origin: true,
  }),
);
app.get("/favicon.ico", (req, res) => res.status(204).end());

/************************** health check + x-portal check */
app.use(portal);

/************************************  Routes  */
/***** user portal  (x-portal: user) */
app.use("/onboarding", user);
app.use("/post", post);
app.use("/like", like);
app.use("/comment", comment);
app.use("/follow", follow);
app.use("/address", address);
/***** admin portal (x-portal: admin) */
app.use("/admin/onboarding", adminRoute);
app.use("/admin/access-role", accessRole);

// catch 404 and forward to error handler
app.use(function (_req, _res, next) {
  next(createError(404));
});

// error handler
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  const status = error.status || 400;
  const message = status >= 500 && process.env.NODE_ENV === "prod" ? "Internal Server Error" : error.message;

  logger.error(`Error: ${status} - ${message} - ${req.method} ${req.url}`);

  return res.status(status).json({ success: false, message });
});

/*********************************** connect db, run migration, create port */
const start = async () => {
  await db_connection();
  await migrate();
  app.listen(PORT, () => {
    console.log(`port is running on port ${PORT}`);
  });
};

if (require.main === module) {
  start();
}

module.exports = app;
