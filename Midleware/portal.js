/**
 * - sets cors headers
 * - answers the health check
 * - checks the x-portal header :  /admin/*  -> "admin"   everything else -> "user" | "staff"
 * - puts the portal on req.portal  (controllers use it to pick the role)
 */
module.exports = (req, res, next) => {
  req.loggerId = Math.floor(10000 + Math.random() * 10000);
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token,x-timezone,Content-Type, x-portal, x-tenant",
  );
  res.header("Access-Control-Max-Age", 1728000);

  if (req.originalUrl === "/" || req.originalUrl.trim() === "") {
    res.send("Health check passed");
    return;
  }
  req.timezone = req.headers["x-timezone"];

  if (req.url.includes("/webhook")) {
    req.headers["x-portal"] = "user";
  }

  const allowedPortals = req.path.startsWith("/admin") ? ["admin"] : ["user", "staff"];

  if (!allowedPortals.includes(req.headers["x-portal"])) {
    return next(new Error("In-proper Request"));
  }

  req.portal = req.headers["x-portal"];
  next();
};
