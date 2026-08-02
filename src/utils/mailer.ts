import nodemailer from "nodemailer";

const requiredMailConfig = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"] as const;

export function isMailConfigured() {
  return requiredMailConfig.every((key) => Boolean(process.env[key]));
}

export async function sendPasswordResetOtpEmail(to: string, otp: string) {
  if (!isMailConfigured()) return false;

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: "DPCS Password Reset OTP",
      text: `Your DPCS password reset OTP is ${otp}. It is valid for 10 minutes.`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1b2428">
          <h2>DPCS Password Reset</h2>
          <p>Your password reset OTP is:</p>
          <p style="font-size:24px;font-weight:700;letter-spacing:4px">${otp}</p>
          <p>This OTP is valid for 10 minutes. If you did not request it, please ignore this email.</p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.warn("Password reset email could not be sent. Falling back to testing OTP response.", error);
    return false;
  }
}
