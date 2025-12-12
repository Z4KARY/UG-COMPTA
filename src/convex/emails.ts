"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

export const sendContactNotification = action({
  args: {
    name: v.string(),
    email: v.string(),
    companyName: v.optional(v.string()),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { name, email, companyName, message } = args;

    try {
      const { data, error } = await resend.emails.send({
        from: "InvoiceFlow <onboarding@resend.dev>", // Update this to a verified domain if available
        to: ["contact@upgrowth.dz"],
        subject: `New Contact Request from ${name}`,
        html: `
          <h1>New Contact Request</h1>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Company:</strong> ${companyName || "N/A"}</p>
          <p><strong>Message:</strong></p>
          <p>${message || "No message provided."}</p>
        `,
      });

      if (error) {
        console.error("Error sending email:", error);
        throw new Error("Failed to send email");
      }

      return data;
    } catch (err) {
      console.error("Failed to send contact notification email:", err);
      // We don't throw here to avoid failing the client request if the email fails, 
      // but in a real app you might want to handle this differently.
      return null;
    }
  },
});
