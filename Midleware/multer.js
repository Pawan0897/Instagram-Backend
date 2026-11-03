const multer = require("multer");
const path = require("path");
const fs = require("fs");

/**************** images are saved in /multerImages and served on /images */
const uploadDir = path.join(__dirname, "..", "multerImages");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

/**************** single file in form-data key "import_posts" */
const uploads = multer({ storage }).single("import_posts");

module.exports = { uploads };
