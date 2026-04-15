import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const EMAIL_TO = "diego1992aguirre@gmail.com";
const TIMEZONE = "America/Mexico_City";

function formatLocalDateForICS(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function formatUtcDateForICS(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

export default async function handler(req, res) {
  const origin = req.headers.origin || req.headers.referer || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  const EMAIL_USER = process.env.EMAIL_USER;
  const EMAIL_PASS = process.env.EMAIL_PASS;

  if (!EMAIL_USER || !EMAIL_PASS)
    return res.status(500).json({ error: "Email credentials are not configured." });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { subject, date, time, message: customMessage, pdfBase64, pdfFilename, recipients } = body;

    if (!subject || !date || !time || !pdfBase64 || !pdfFilename)
      return res.status(400).json({ error: "Subject, date, time and PDF file are required." });

    const startLocal = new Date(`${date}T${time}:00`);
    const endLocal = new Date(startLocal.getTime() + 60 * 60 * 1000);

    const monthsEs = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
    const daysEs = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
    const longDateEs = `${daysEs[startLocal.getDay()]} ${startLocal.getDate()} de ${monthsEs[startLocal.getMonth()]} de ${startLocal.getFullYear()}`;

    const [hourStr = "0", minuteStr = "00"] = time.split(":");
    let hourNum = Number(hourStr);
    if (Number.isNaN(hourNum)) hourNum = 0;
    const isPM = hourNum >= 12;
    let hour12 = hourNum % 12;
    if (hour12 === 0) hour12 = 12;
    const formattedTime = `${hour12}:${minuteStr} ${isPM ? "p.m." : "a.m."}`;

    const uid = `${Date.now()}@verum-mail`;
    const fullTitle = `Comité de Calificación - ${subject}`;
    const trimmedCustom = customMessage && String(customMessage).trim();

    const { data: configRow } = await supabase.from("config").select("value").eq("key", "meeting_link").single();
    const meetingLink = configRow?.value ?? "https://teams.live.com/meet/9330207434019?p=11pDHEIX4Cep47Qc3Z";

    const baseText = `Estimados miembros del comité\n\nLos estamos convocando el próximo ${longDateEs}, a las ${formattedTime} con la finalidad de revisar la calificación de ${subject}.`;
    const customBlock = trimmedCustom ? `\n\n${trimmedCustom}` : "";
    const teamsText = `\n\nReunión de Microsoft Teams\nUnirse: ${meetingLink}\nSaludos,`;
    const textForEmail = `${baseText}${customBlock}${teamsText}`;

    const baseHtml = `<p>Estimados miembros del comité</p><p>Los estamos convocando el próximo <strong>${longDateEs}</strong>, a las <strong>${formattedTime}</strong> con la finalidad de revisar la calificación de ${subject}.</p>`;
    const customHtml = trimmedCustom ? `<p>${trimmedCustom.replace(/\n/g, "<br />")}</p>` : "";
    const teamsHtml = `<p style="font-size:15pt;font-weight:bold;">Reunión de Microsoft Teams<br />Unirse: <a href="${meetingLink}">${meetingLink}</a></p><p>Saludos,</p>`;
    const htmlForEmail = `${baseHtml}${customHtml}${teamsHtml}`;

    const toList = Array.isArray(recipients) && recipients.length ? recipients : [EMAIL_TO];

    const icsContent = [
      "BEGIN:VCALENDAR","PRODID:-//Verum Mail//EN","VERSION:2.0","CALSCALE:GREGORIAN","METHOD:REQUEST",
      "BEGIN:VEVENT",
      `UID:${uid}`,`DTSTAMP:${formatUtcDateForICS(new Date())}`,
      `DTSTART;TZID=${TIMEZONE}:${formatLocalDateForICS(startLocal)}`,
      `DTEND;TZID=${TIMEZONE}:${formatLocalDateForICS(endLocal)}`,
      `SUMMARY:${fullTitle}`,`DESCRIPTION:${textForEmail.replace(/\n/g, "\\n")}`,
      `ORGANIZER;CN=Verum Committee:mailto:${EMAIL_USER}`,
      `ATTENDEE;CN=Diego Aguirre;ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:${EMAIL_TO}`,
      "END:VEVENT","END:VCALENDAR","",
    ].join("\r\n");

    const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: EMAIL_USER, pass: EMAIL_PASS } });
    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    await transporter.sendMail({
      from: EMAIL_USER, to: toList.join(", "), subject: fullTitle,
      text: textForEmail, html: htmlForEmail,
      icalEvent: { filename: "invite.ics", method: "REQUEST", content: icsContent },
      attachments: [{ filename: pdfFilename, content: pdfBuffer }],
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error sending email:", err);
    return res.status(500).json({ error: "Failed to send email." });
  }
}
