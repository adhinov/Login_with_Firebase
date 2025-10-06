// utils/sendEmail.js
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to, subject, html) => {
  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to,
      subject,
      html,
    });
    console.log(`✅ Email terkirim ke ${to}`);
  } catch (error) {
    console.error("❌ Gagal mengirim email:", error);
    throw new Error("Gagal mengirim email");
  }
};
