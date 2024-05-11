"use server";

import nodemailer from "nodemailer";

export const sendBeefRequestEmail = async (to: string) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    logger: true,
    debug: true,
    auth: {
      user: "decobieapp@gmail.com",
      pass: process.env.SMTP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: "Settlebeef app",
    to,
    subject: "Someone has a beef with you!",
    html: `
  <div>
    <h2>Join Decobie to resolve the beef</h2>
    <a href="${process.env.NEXT_PUBLIC_SITE_URL}">Open Decobie app</a>
  </div>
  `,
  });

  console.log(`Request email sent to ${to}`);
};
