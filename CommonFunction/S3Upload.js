const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const multer = require("multer");
const { Readable } = require("stream");
const { Parser } = require("json2csv");

/**************** S3 client is created on first use (so the app boots without AWS keys) */
let s3Client;
const getClient = () => {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.BUCKET_REGION,
      credentials: {
        accessKeyId: process.env.BUCKET_ID,
        secretAccessKey: process.env.BUCKET_KEY,
      },
    });
  }
  return s3Client;
};

const deleteFileIfExists = async (bucket, key) => {
  try {
    await getClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    console.log("Previous image deleted successfully.");
  } catch (err) {
    if (err.name !== "NoSuchKey") {
      console.log("Error deleting the image:", err.message);
    } else {
      console.log("Image not found, proceeding with upload.");
    }
  }
};

/**************** use before the s3 middlewares : multer.single("file") / .array("files") in memory */
const upload = multer({ storage: multer.memoryStorage() });

const s3UploadMiddleware = async (req, res, next) => {
  if (!req.file) {
    return next();
  }
  const bucket = process.env.BUCKET_NAME;
  const key = Date.now() + "-" + req.file.originalname;
  await deleteFileIfExists(bucket, key);
  const uploader = new Upload({
    client: getClient(),
    params: {
      Bucket: bucket,
      Key: key,
      Body: Readable.from(req.file.buffer),
      ACL: "public-read",
    },
  });
  try {
    const data = await uploader.done();
    req.file.location = data.Location;
    next();
  } catch (error) {
    console.error("Error uploading file:", error.message);
    next(error);
  }
};

const s3MultiUploadMiddleware = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }
  const bucket = process.env.BUCKET_NAME;
  const uploadPromises = req.files.map(async (file) => {
    const key = Date.now() + "-" + file.originalname;
    try {
      await deleteFileIfExists(bucket, key);
      const uploader = new Upload({
        client: getClient(),
        params: {
          Bucket: bucket,
          Key: key,
          Body: Readable.from(file.buffer),
          ACL: "public-read",
        },
      });
      await uploader.done();
      return `${process.env.CDN_URL}/${key}`;
    } catch (error) {
      console.error("Error uploading file:", error.message);
      return Promise.reject(error);
    }
  });
  try {
    req.files = await Promise.all(uploadPromises); // urls replace the multer files
    next();
  } catch (error) {
    next(error);
  }
};

const s3UploadFile = async (buffer, fileName) => {
  const uploader = new Upload({
    client: getClient(),
    params: {
      Bucket: process.env.BUCKET_NAME,
      Key: `${Date.now()}-${fileName}`,
      Body: Readable.from(buffer),
      ACL: "public-read",
    },
  });
  return await uploader.done();
};

/**************** list of objects -> csv -> s3, returns the file url */
const generateCsv = async (list, fileName) => {
  const fields = Object.keys(list[0]);
  const csv = new Parser({ fields });
  const buffer = Buffer.from(csv.parse(list), "utf-8");
  const uploadRes = await s3UploadFile(buffer, fileName);
  return uploadRes.Location;
};

const uploadPdfToS3 = async (buffer, originalname) => {
  try {
    const uploadRes = await s3UploadFile(buffer, originalname);
    return uploadRes.Location;
  } catch (error) {
    console.error("Error uploading PDF to S3:", error);
    throw new Error("Failed to upload PDF");
  }
};

module.exports = {
  upload,
  s3UploadMiddleware,
  s3MultiUploadMiddleware,
  generateCsv,
  uploadPdfToS3,
};
