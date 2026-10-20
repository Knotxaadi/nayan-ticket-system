import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { Buffer } from "node:buffer";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const HTML_ENTITIES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => HTML_ENTITIES[char]);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "Method not allowed.",
    });
  }

  try {
    const {
      name,
      email,
      ticketName,
      price,
      ticketNumber,
      eventDate,
      venue,
      ticketImage,
    } = req.body || {};

    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.length > 150 ||
      typeof email !== "string" ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof ticketName !== "string" ||
      ticketName.length > 60 ||
      typeof ticketNumber !== "string" ||
      !ticketNumber.trim() ||
      ticketNumber.length > 80 ||
      typeof eventDate !== "string" ||
      eventDate.length > 100 ||
      typeof venue !== "string" ||
      venue.length > 200 ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0 ||
      typeof ticketImage !== "string" ||
      !ticketImage.startsWith("data:image/png;base64,")
    ) {
      return res.status(400).json({
        error: "Please enter valid ticket details.",
      });
    }

    const imageBase64 = ticketImage.slice("data:image/png;base64,".length);

    if (imageBase64.length > 11_200_000 || imageBase64.length % 4 !== 0) {
      return res.status(400).json({
        error: "The ticket image is invalid or too large.",
      });
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPassword) {
      console.error("Gmail environment variables are missing.");

      return res.status(500).json({
        error: "Email service is not configured.",
      });
    }

    const safeTicketNumber =
      ticketNumber.replace(/[^a-zA-Z0-9_-]/g, "") || "NAYAN-ticket";

    const ticketBuffer = Buffer.from(imageBase64, "base64");


    const details = `
      <div style="padding:16px;background:#f4f4f4;border-radius:8px;margin:20px 0">
        <p><strong>Ticket type:</strong> ${escapeHtml(ticketName)}</p>
        <p><strong>Ticket number:</strong> ${escapeHtml(ticketNumber)}</p>
        <p><strong>Price:</strong> ₹${escapeHtml(price)}</p>
        <p><strong>Date:</strong> ${escapeHtml(eventDate)}</p>
        <p><strong>Venue:</strong> ${escapeHtml(venue)}</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"NAYAN | THE MEHFEEL" <${process.env.GMAIL_USER}>`,
      to: email.trim(),
      subject: `Your NAYAN Ticket — ${ticketNumber}`,

      text: `Hi ${name},

Thank you for being part of NAYAN, presented by THE MEHFEEL!

Your personalized ticket is ready.

Ticket type: ${ticketName}
Ticket number: ${ticketNumber}
Price: INR ${price}
Date: ${eventDate}
Venue: ${venue}

Your ticket is included in this email and attached as a PNG image.

Please keep your ticket safe and ready for event entry.

See you at NAYAN!

Warm regards,
Team THE MEHFEEL`,

      html: `
        <div style="margin:0;background:#f1f1f1;padding:24px 10px;font-family:Arial,sans-serif;color:#222">
          <div style="max-width:620px;margin:auto;background:#fff;border-radius:12px;overflow:hidden">
            <div style="background:#090909;color:#c7ff35;padding:24px">
              <p style="font-size:11px;letter-spacing:4px;margin:0 0 10px">
                THE MEHFEEL PRESENTS
              </p>
              <h1 style="font-size:38px;letter-spacing:5px;margin:0">
                NAYAN.
              </h1>
            </div>

            <div style="padding:24px">
              <h2 style="margin-top:0">Your ticket is ready!</h2>

              <p>Hi <strong>${escapeHtml(name)}</strong>,</p>

              <p>
                Thank you for being part of NAYAN — an immersive music
                experience presented by THE MEHFEEL. We're excited to
                welcome you for a night of music, culture and connection.
              </p>

              <p><strong>Your personalized ticket:</strong></p>

              <img
                src="cid:nayan-ticket"
                alt="Personalized NAYAN ticket"
                width="560"
                style="display:block;width:100%;max-width:560px;height:auto;border:0;border-radius:8px"
              />

              ${details}

              <p>
                Your ticket is also attached as a PNG image. Please keep
                it safe and ready for event entry.
              </p>

              <p>See you at NAYAN!</p>

              <p>
                Warm regards,<br/>
                <strong>Team THE MEHFEEL</strong>
              </p>
            </div>

            <div style="padding:15px;background:#090909;color:#c7ff35;text-align:center;font-size:11px;letter-spacing:2px">
              MUSIC • CULTURE • CONNECTION
            </div>
          </div>
        </div>
      `,

      attachments: [
        {
          filename: `${safeTicketNumber}.png`,
          content: ticketBuffer,
          contentType: "image/png",
          cid: "nayan-ticket",
        },
      ],
    });

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      success: true,
      message: "Ticket email sent.",
    });
  } catch (error) {
    console.error("Ticket email error:", error.message);

    return res.status(500).json({
      error: "Unable to send the email. Check your Gmail configuration.",
    });
  }
}
