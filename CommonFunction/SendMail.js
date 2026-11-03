// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: process.env.EMAIL_PORT,
//   secure: true, // use SSL
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
//   tls: {
//     rejectUnauthorized: true,
//   },
// });

// /**************** send mail : { to, subject, message }  (never throws) */
// const send = async ({ to, subject, message }) => {
//   try {
//     const info = await transporter.sendMail({
//       from: `"${process.env.EMAIL_FROM}" <${process.env.EMAIL_USER}>`,
//       to: [].concat(to),
//       subject: `${subject}`,
//       text: `${message}`,
//       html: `${message}`,
//     });

//     console.log("EmailService", "Message sent: %s", info.messageId);
//   } catch (error) {
//     console.error("EmailService", error);
//   }
// };

// module.exports = { send };

const nodemailer = require("nodemailer");

const port = Number(process.env.EMAIL_PORT || 587);

// Create Transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: port,

  // Port 465 = true, Port 587 = false
  secure: port === 465,

  // Port 587 par STARTTLS compulsory rakho
  requireTLS: port === 587,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  tls: {
    rejectUnauthorized: true,
  },
});

// Send Mail Function
const send = async ({ to, subject, message }) => {
  try {
    const html = String(message);

    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM}" <${process.env.EMAIL_USER}>`,
      to: [].concat(to),
      subject: subject,
      text: html.replace(/<[^>]*>/g, ""),
      html: html,
    });

    console.log("Email Sent:", info.messageId);

    return info;

  } catch (error) {
    console.log("Email Error:", error.message);
    throw error;
  }
};

// Export
module.exports = {
  send,
  transporter,
};