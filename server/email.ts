import nodemailer from "nodemailer";

export async function sendEmailNotification(toEmail: string, subject: string, htmlContent: string) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "no-reply@krishisetu.com";

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      await transporter.sendMail({
        from,
        to: toEmail,
        subject,
        html: htmlContent,
      });
      console.log(`[EMAIL SENT] Real email sent to ${toEmail}: ${subject}`);
    } catch (error) {
      console.error(`[EMAIL ERROR] Failed to send email to ${toEmail}:`, error);
    }
  } else {
    // Development fallback / Mock logger
    console.log("\n======================================== MOCK EMAIL ========================================");
    console.log(`TO:      ${toEmail}`);
    console.log(`FROM:    ${from}`);
    console.log(`SUBJECT: ${subject}`);
    console.log("BODY:");
    console.log(htmlContent.replace(/<[^>]*>/g, "\n").replace(/\n+/g, "\n").trim()); // Clean up tags/newlines for console printing
    console.log("============================================================================================\n");
  }
}
