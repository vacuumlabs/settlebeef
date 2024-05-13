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

  // FIXME: The <a> tag doesn't work
  await transporter.sendMail({
    from: "SettleBeef",
    to,
    subject: "Someone has beef they want you to settle! 🔥🥩",
    html: `
  <div>
    <h2>Join SettleBeef to settle their beef on-chain, no wallet required! ⛓️🤠</h2>
    <p>
      SettleBeef is an on-chain Twitter/X/offline beef settlement platform 🌾🧑‍🌾 <br/>
      No wallet required, just sign in with your email and settle beef on-chain with state-of-the-art Account Abstraction and Smart Contract Wallets! 📧🔗 <br />
      As an arbiter, you will decide the outcome of the beef and receive a cut of the bet for your services! 💰🤑 <br />
      All you need to do is sign in with your email and confirm you're ready to settle this beef with a gasless transaction! 📧🔥🥩 <br />
      What are you waiting for, cowboy/cowgirl? 🤠🐄
    </p>
    <a href="${process.env.VERCEL_URL || "localhost:3000"}">👏Settle👏Your👏Beef👏 <br />🐄🐄🐄🔥🔥🔥</a>
  </div>
  `,
  });
};
