import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to, subject, html) => {
  try {
    const response = await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to,
      subject,
      html,
    });

    console.log("✅ Email response:", response);
  } catch (error) {
    console.error("❌ Gagal mengirim email:");
    if (error.response) {
      console.error("Response:", error.response);
    }
    console.error("Message:", error.message);
    throw new Error("Gagal mengirim email");
  }
};
