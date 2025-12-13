import { Email } from "@convex-dev/auth/providers/Email";

function generateOTP(length: number = 6): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => (byte % 10).toString()).join("");
}

export const emailOtp = Email({
  id: "email-otp",
  maxAge: 60 * 15, // 15 minutes
  // This function can be asynchronous
  generateVerificationToken() {
    return generateOTP(6);
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    try {
      const response = await fetch("https://email.vly.ai/send_otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "vlytothemoon2025",
        },
        body: JSON.stringify({
          to: email,
          otp: token,
          appName: process.env.VLY_APP_NAME || "a vly.ai application",
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send OTP: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  },
});