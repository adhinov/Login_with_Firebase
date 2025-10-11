// services/resendClient.js
import { Resend } from "resend";

let resendInstance;

// Gunakan instance global agar tidak dideklarasikan ulang saat hot-reload
if (!global.__resendInstance) {
  global.__resendInstance = new Resend(process.env.RESEND_API_KEY);
}
resendInstance = global.__resendInstance;

export default resendInstance;
