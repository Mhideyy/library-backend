import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, templateName, context) => {
  try {
    const filePath = path.join(
      process.cwd(),
      "emailTemplates",
      `${templateName}.html`,
    );
    let html = fs.readFileSync(filePath, "utf-8");
    for (const key in context) {
      html = html.replace(new RegExp(`{{${key}}}`, "g"), context[key]);
    }

    await transporter.sendMail({
      from: process.env.EMAIL,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("REAL EMAIL ERROR 👉", error);
    throw error; // 👈 VERY IMPORTANT
  }
};

export default sendEmail;
