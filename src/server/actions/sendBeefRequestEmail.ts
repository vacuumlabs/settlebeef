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
    from: "SettleBeef",
    to,
    subject: "Someone has beef with you! 🔥🥩",
    html: `
  <div>
    <h2>Join SettleBeef to settle your beef on-chain, no wallet required! ⛓️🤠</h2>
    <p>
      SettleBeef is an on-chain Twitter/X/offline beef settlement platform 🌾🧑‍🌾 <br/>
      No wallet required, just sign in with your email and settle your beef on-chain with state-of-the-art Account Abstraction and Smart Contract Wallets! 📧🔗 <br />
      What are you waiting for, cowboy/cowgirl? 🤠🐄
    </p>
    <a href="${process.env.NEXT_PUBLIC_SITE_URL}">👏Settle👏Your👏Beef👏 <br />🐄🐄🐄🔥🔥🔥</a>
  </div>
  `,
  });

  console.log(`Request email sent to ${to}`);
};
