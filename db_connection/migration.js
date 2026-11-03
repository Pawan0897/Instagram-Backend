const { DB_VERSION } = require("../Modal/dbVersion");
const { CMS } = require("../Modal/cms");
const { FAQ } = require("../Modal/faq");
const { USER } = require("../Modal/user");
const constants = require("../CommonFunction/Constants");

/**************** runs once (db version 0 -> 1) : default cms, admins and faqs */
const migrate = async () => {
  console.log("checking database version...");
  let dbVersion = await DB_VERSION.findOne({});

  if (!dbVersion || dbVersion.version < 1) {
    await Promise.all([addCmsData(), addInitialData(), addMoreAdmin(), addFaqsData()]);
    dbVersion = await DB_VERSION.findOneAndUpdate(
      {},
      { $set: { version: 1 } },
      { upsert: true, new: true },
    );
  }
};

/**************** initial cms data */
async function addCmsData() {
  const data = {
    email: "demoapptunix@yopmail.com",
    countryCode: "+91",
    phone: "1234567890",
    terms: "terms",
    terms_ar: "terms_ar",
    privacyPolicy: "policy",
    privacyPolicy_ar: "policy_ar",
    aboutUs: "app",
    aboutUs_ar: "app_ar",
  };
  await new CMS(data).save();
}

/**************** initial admin */
async function addInitialData() {
  const admin = {
    firstName: "admin",
    email: "admin.educational@yopmail.com",
    password: "Test@123",
    role: constants.ROLE.ADMIN,
    isEmailVerified: true,
  };

  await new USER(admin).save();
}

/**************** admins for testing */
async function addMoreAdmin() {
  const admin = {
    firstName: "admin",
    email: "admin.testing@yopmail.com",
    password: "Test@123",
    role: constants.ROLE.ADMIN,
    isEmailVerified: true,
  };

  await new USER(admin).save();
  await new USER({ ...admin, email: "admin.developer@yopmail.com" }).save();
  await new USER({ ...admin, email: "admin.backend@yopmail.com" }).save();
  await new USER({ ...admin, email: "admin.app@yopmail.com" }).save();
  await new USER({ ...admin, email: "admin.staff@yopmail.com" }).save();
}

/**************** initial faqs */
async function addFaqsData() {
  const data = [
    { question: "question1", answer: "answer1" },
    { question: "question2", answer: "answer2" },
  ];
  await FAQ.insertMany(data);
}

module.exports = { migrate };
