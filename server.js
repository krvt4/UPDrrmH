import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import nodemailer from "nodemailer";
import admin from "firebase-admin";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("✅ API running from file:", __filename);
console.log("✅ NODE_ENV:", process.env.NODE_ENV || "(not set)");
console.log("✅ PORT env:", process.env.PORT || "(not set)");

const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: "2mb" }));

app.use((req, res, next) => {
  console.log(`➡️  ${req.method} ${req.url}`);
  next();
});

app.get("/api/ping", (req, res) => {
  return res.json({ ok: true, from: "api", file: __filename });
});

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({ credential: admin.credential.cert(svc) });
    console.log("✅ Firebase Admin: initialized from FIREBASE_SERVICE_ACCOUNT_JSON");
  } else {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
    console.log("✅ Firebase Admin: initialized from applicationDefault()");
  }
} catch (e) {
  console.error("❌ Firebase Admin init failed:", e?.message || e);
}

const db = admin.firestore();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error("❌ SMTP verification failed:", error?.message || error);
  } else {
    console.log("✅ SMTP server is ready to send emails");
  }
});

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_SENDS_PER_15MIN = 5;
const MAX_SENDS_PER_IP_15MIN = 20;

const bucket = new Map();

function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const cur = bucket.get(key);

  if (!cur || now > cur.resetAt) {
    bucket.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (cur.count >= max) {
    return { ok: false, retryAfterMs: cur.resetAt - now };
  }

  cur.count += 1;
  return { ok: true };
}

function hashOtp(uid, otp) {
  const salt = process.env.OTP_SECRET || "dev-secret";
  return crypto.createHash("sha256").update(`${salt}|${uid}|${otp}`).digest("hex");
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function verifyTokenOrThrow(token) {
  if (!token) throw new Error("Missing token.");
  return await admin.auth().verifyIdToken(token);
}

async function requireAdmin(decodedUid) {
  const snap = await db.collection("users").doc(decodedUid).get();
  if (!snap.exists) throw new Error("Admin profile not found.");
  const data = snap.data();
  if ((data?.role || "").toLowerCase() !== "admin") throw new Error("Not authorized.");
  return data;
}

async function writeAuditLog({ adminUid, adminEmail, action, target }) {
  await db.collection("adminAuditLogs").add({
    action: String(action || "").toLowerCase(),
    adminUid: adminUid || "",
    adminEmail: adminEmail || "",
    target: target || {},
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAtMs: Date.now(),
  });
}

function toMillisMaybe(createdAt, createdAtMs) {
  if (typeof createdAtMs === "number") return createdAtMs;
  if (createdAt?.toMillis && typeof createdAt.toMillis === "function") return createdAt.toMillis();
  if (typeof createdAt?._seconds === "number") return createdAt._seconds * 1000;
  if (typeof createdAt?.seconds === "number") return createdAt.seconds * 1000;
  return null;
}

function extractTicketId(subject = "") {
  const match = String(subject).match(/\[Ticket:([A-Za-z0-9_-]+)\]/i);
  return match ? match[1] : "";
}

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function cleanEmailReplyText(text = "") {
  const raw = String(text || "").replace(/\r\n/g, "\n").trim();
  if (!raw) return "";

  const splitters = [
    "\nOn ",
    "\nFrom:",
    "\n-----Original Message-----",
    "\n________________________________",
  ];

  let cleaned = raw;
  for (const marker of splitters) {
    const idx = cleaned.indexOf(marker);
    if (idx > 0) {
      cleaned = cleaned.slice(0, idx).trim();
    }
  }

  return cleaned.trim();
}

async function saveInboundReplyToTicket({
  ticketId,
  fromEmail,
  fromName,
  subject,
  body,
  messageId,
}) {
  const ticketRef = db.collection("contactMessages").doc(ticketId);
  const ticketSnap = await ticketRef.get();

  if (!ticketSnap.exists) {
    throw new Error(`Ticket not found: ${ticketId}`);
  }

  const now = Date.now();
  const safeBody = cleanEmailReplyText(body);

  if (!safeBody) {
    return { skipped: true, reason: "Empty body after cleaning." };
  }

  const existing = await ticketRef
    .collection("thread")
    .where("messageId", "==", String(messageId || ""))
    .limit(1)
    .get();

  if (!existing.empty) {
    return { skipped: true, reason: "Duplicate message." };
  }

  const replyData = {
    body: safeBody,
    senderRole: "user",
    senderUid: "",
    senderEmail: normalizeEmail(fromEmail),
    senderName: fromName || fromEmail || "Requester",
    sentViaEmail: true,
    messageId: String(messageId || ""),
    subject: String(subject || ""),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAtMs: now,
  };

  await ticketRef.collection("thread").add(replyData);

  await ticketRef.set(
    {
      status: "open",
      awaitingAdmin: true,
      slaDueAtMs: now + 24 * 60 * 60 * 1000,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAtMs: now,
      statusUpdatedAtMs: now,
      lastSenderUid: "",
      lastSenderEmail: normalizeEmail(fromEmail),
      lastSenderName: fromName || fromEmail || "Requester",
      lastInboundSubject: String(subject || ""),
      lastInboundMessageId: String(messageId || ""),
    },
    { merge: true }
  );

  return { ok: true };
}

let inboundPollStarted = false;

async function pollInboxOnce() {
  const host = process.env.IMAP_HOST;
  const port = Number(process.env.IMAP_PORT || 993);
  const secure = String(process.env.IMAP_SECURE || "true").toLowerCase() === "true";
  const user = process.env.IMAP_USER;
  const pass = process.env.IMAP_PASS;
  const mailbox = process.env.IMAP_MAILBOX || "INBOX";

  if (!host || !user || !pass) {
    console.log("ℹ️ IMAP polling skipped: missing IMAP env vars.");
    return;
  }

  const client = new ImapFlow({
    host,
    port,
    secure,
    auth: { user, pass },
    logger: false,
  });

  await client.connect();

  let lock;
  try {
    lock = await client.getMailboxLock(mailbox);

    const unseenUids = await client.search({ seen: false });

    for (const uid of unseenUids) {
      try {
        const msg = await client.fetchOne(uid, {
          uid: true,
          envelope: true,
          source: true,
          flags: true,
        });

        if (!msg?.source) continue;

        const parsed = await simpleParser(msg.source);
        const subject = parsed.subject || "";
        const ticketId = extractTicketId(subject);

        if (!ticketId) {
          await client.messageFlagsAdd(uid, ["\\Seen"]);
          continue;
        }

        const fromValue = parsed.from?.value?.[0] || {};
        const fromEmail = normalizeEmail(fromValue.address || "");
        const fromName = fromValue.name || fromEmail;
        const textBody =
          parsed.text ||
          parsed.html?.replace(/<[^>]+>/g, " ") ||
          "";

        const result = await saveInboundReplyToTicket({
          ticketId,
          fromEmail,
          fromName,
          subject,
          body: textBody,
          messageId: parsed.messageId || `${uid}`,
        });

        console.log("📥 inbound email processed:", {
          uid,
          ticketId,
          fromEmail,
          result,
        });

        await client.messageFlagsAdd(uid, ["\\Seen"]);
      } catch (msgErr) {
        console.error("❌ Failed to process inbound message:", msgErr?.message || msgErr);
      }
    }
  } finally {
    if (lock) lock.release();
    await client.logout().catch(() => {});
  }
}

function startInboundEmailPolling() {
  if (inboundPollStarted) return;
  inboundPollStarted = true;

  const intervalMs = Number(process.env.IMAP_POLL_MS || 60000);

  const run = async () => {
    try {
      await pollInboxOnce();
    } catch (e) {
      console.error("❌ IMAP poll failed:", e?.message || e);
    }
  };

  run();
  setInterval(run, intervalMs);
}

const uploadDir = path.join(__dirname, "assets/uploads");
const receiptDir = path.join(uploadDir, "receipts");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(receiptDir)) fs.mkdirSync(receiptDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

app.use("/uploads", express.static(uploadDir));

app.post("/upload", upload.array("images", 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }
  const imageUrls = req.files.map((file) => `/uploads/${file.filename}`);
  res.json({ imageUrls });
});

const receiptStorage = multer.diskStorage({
  destination: receiptDir,
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const receiptUpload = multer({ storage: receiptStorage });

app.post("/upload-receipt", receiptUpload.single("receipt"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No receipt uploaded" });
  const receiptUrl = `/uploads/receipts/${req.file.filename}`;
  res.json({ receiptUrl });
});

app.post("/api/contact", async (req, res) => {
  try {
    console.log("✅ HIT POST /api/contact body:", req.body);

    const { name, email, company, category, message } = req.body || {};
    if (!name || !email || !company || !category || !message) {
      return res.status(400).json({ ok: false, error: "Missing required fields." });
    }

    const now = Date.now();

    await db.collection("contactMessages").add({
      name,
      email,
      company,
      category,
      message,
      status: "open",
      awaitingAdmin: true,
      slaDueAtMs: now + 24 * 60 * 60 * 1000,
      lastSenderName: name,
      lastSenderEmail: email,
      lastSenderUid: "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtMs: now,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAtMs: now,
      statusUpdatedAtMs: now,
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error("❌ /api/contact error:", e?.message || e);
    return res.status(500).json({ ok: false, error: e?.message || "Failed to save message." });
  }
});

app.get("/api/contact", async (req, res) => {
  try {
    const snap = await db
      .collection("contactMessages")
      .orderBy("createdAtMs", "desc")
      .limit(100)
      .get();

    return res.json({
      ok: true,
      messages: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    });
  } catch (e) {
    console.error("❌ GET /api/contact error:", e?.message || e);
    return res.status(500).json({ ok: false, error: e?.message || "Failed to load messages." });
  }
});

app.delete("/api/contact/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ ok: false, error: "Missing message id." });
    }

    const docRef = db.collection("contactMessages").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ ok: false, error: "Message not found." });
    }

    const threadSnap = await docRef.collection("thread").get();
    const batch = db.batch();

    threadSnap.forEach((threadDoc) => {
      batch.delete(threadDoc.ref);
    });
    batch.delete(docRef);

    await batch.commit();

    return res.json({ ok: true, deletedId: id });
  } catch (e) {
    console.error("❌ /api/contact DELETE error:", e?.message || e);
    return res.status(500).json({ ok: false, error: e?.message || "Failed to delete message." });
  }
});

app.patch("/api/contact/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, token } = req.body || {};

    const allowed = ["open", "in_progress", "closed"];
    if (!id) return res.status(400).json({ ok: false, error: "Missing id" });
    if (!status || !allowed.includes(String(status))) {
      return res
        .status(400)
        .json({ ok: false, error: `Invalid status. Use: ${allowed.join(", ")}` });
    }

    const decoded = await verifyTokenOrThrow(token);
    const adminProfile = await requireAdmin(decoded.uid);

    const docRef = db.collection("contactMessages").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) {
      return res.status(404).json({ ok: false, error: "Message not found" });
    }

    const now = Date.now();

    const update = {
      status,
      statusUpdatedAtMs: now,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAtMs: now,
      lastSenderUid: decoded.uid,
      lastSenderEmail: decoded.email || adminProfile?.email || "",
      lastSenderName: adminProfile?.fullName || decoded.name || decoded.email || "Admin",
    };

    if (status === "open") {
      update.awaitingAdmin = true;
      update.slaDueAtMs = now + 24 * 60 * 60 * 1000;
      update.closedAt = null;
      update.closedAtMs = null;
    } else if (status === "in_progress") {
      update.awaitingAdmin = false;
      update.closedAt = null;
      update.closedAtMs = null;
    } else if (status === "closed") {
      update.awaitingAdmin = false;
      update.closedAt = admin.firestore.FieldValue.serverTimestamp();
      update.closedAtMs = now;
    }

    await docRef.update(update);

    return res.json({ ok: true, id, status });
  } catch (e) {
    console.error("❌ PATCH /api/contact/:id/status error:", e?.message || e);
    return res.status(500).json({ ok: false, error: e?.message || "Failed to update status" });
  }
});

app.get("/api/contact/:id/thread", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ ok: false, error: "Missing ticket id." });
    }

    const ticketRef = db.collection("contactMessages").doc(id);
    const ticketSnap = await ticketRef.get();

    if (!ticketSnap.exists) {
      return res.status(404).json({ ok: false, error: "Ticket not found." });
    }

    const threadSnap = await ticketRef
      .collection("thread")
      .orderBy("createdAtMs", "asc")
      .get();

    const thread = threadSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.json({ ok: true, thread });
  } catch (e) {
    console.error("❌ GET /api/contact/:id/thread error:", e?.message || e);
    return res
      .status(500)
      .json({ ok: false, error: e?.message || "Failed to load thread." });
  }
});

app.post("/api/contact/:id/reply", async (req, res) => {
  try {
    const { id } = req.params;
    const { token, body } = req.body || {};

    if (!id) {
      return res.status(400).json({ ok: false, error: "Missing ticket id." });
    }

    if (!body || !String(body).trim()) {
      return res.status(400).json({ ok: false, error: "Reply body is required." });
    }

    const decoded = await verifyTokenOrThrow(token);
    const adminProfile = await requireAdmin(decoded.uid);

    const ticketRef = db.collection("contactMessages").doc(id);
    const ticketSnap = await ticketRef.get();

    if (!ticketSnap.exists) {
      return res.status(404).json({ ok: false, error: "Ticket not found." });
    }

    const ticket = ticketSnap.data() || {};
    const now = Date.now();

    const replyData = {
      body: String(body).trim(),
      senderRole: "admin",
      senderUid: decoded.uid,
      senderEmail: decoded.email || adminProfile?.email || "",
      senderName: adminProfile?.fullName || decoded.name || decoded.email || "Admin",
      sentViaEmail: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtMs: now,
    };

    const replyRef = await ticketRef.collection("thread").add(replyData);

    await ticketRef.set(
      {
        status: "in_progress",
        awaitingAdmin: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAtMs: now,
        statusUpdatedAtMs: now,
        lastSenderUid: decoded.uid,
        lastSenderEmail: decoded.email || adminProfile?.email || "",
        lastSenderName: adminProfile?.fullName || decoded.name || decoded.email || "Admin",
      },
      { merge: true }
    );

    if (ticket.email) {
      try {
        await transporter.sendMail({
          from: process.env.MAIL_FROM || process.env.SMTP_USER,
          to: ticket.email,
          subject: `Re: [Ticket:${id}] ${ticket.category || "Contact Inquiry"} - DRRM for Health`,
          text: String(body).trim(),
        });
      } catch (mailErr) {
        console.error("⚠️ Failed to send reply email:", mailErr?.message || mailErr);
      }
    }

    return res.json({
      ok: true,
      replyId: replyRef.id,
      reply: {
        ...replyData,
        createdAtMs: now,
      },
    });
  } catch (e) {
    console.error("❌ POST /api/contact/:id/reply error:", e?.message || e);
    return res
      .status(500)
      .json({ ok: false, error: e?.message || "Failed to send reply." });
  }
});

app.post("/api/send-login-code", async (req, res) => {
  try {
    const { uid, email, token } = req.body || {};
    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.ip;

    const decoded = await verifyTokenOrThrow(token);

    if (decoded.uid !== uid) return res.status(403).json({ error: "UID mismatch." });
    if ((decoded.email || "").toLowerCase() !== (email || "").toLowerCase()) {
      return res.status(403).json({ error: "Email mismatch." });
    }

    const rl1 = rateLimit(`send:uid:${uid}`, MAX_SENDS_PER_15MIN, 15 * 60 * 1000);
    if (!rl1.ok) return res.status(429).json({ error: "Too many requests. Try later." });

    const rl2 = rateLimit(`send:ip:${ip}`, MAX_SENDS_PER_IP_15MIN, 15 * 60 * 1000);
    if (!rl2.ok) return res.status(429).json({ error: "Too many requests from this IP." });

    const userSnap = await db.collection("users").doc(uid).get();
    if (!userSnap.exists) return res.status(404).json({ error: "User profile not found." });

    const ref = db.collection("loginOtps").doc(uid);
    const snap = await ref.get();
    const data = snap.exists ? snap.data() : null;

    const now = Date.now();
    if (data?.lastSentAt && now - data.lastSentAt < RESEND_COOLDOWN_MS) {
      return res.status(429).json({ error: "Please wait before resending." });
    }

    const otp = generateOtp();
    const otpHash = hashOtp(uid, otp);
    const expiresAt = now + OTP_TTL_MS;

    await ref.set(
      {
        email: (email || "").toLowerCase(),
        otpHash,
        expiresAt,
        lastSentAt: now,
        attempts: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Your login verification code",
      text: `Your 6-digit login code is: ${otp}\n\nThis code expires in 10 minutes. If you didn't request this, you can ignore this email.`,
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error("❌ /api/send-login-code error:", e?.message || e);
    if (e?.stack) console.error(e.stack);
    return res.status(400).json({ error: e?.message || "Failed to send code." });
  }
});

app.post("/api/verify-login-code", async (req, res) => {
  try {
    const { uid, code, token } = req.body || {};
    const decoded = await verifyTokenOrThrow(token);

    if (decoded.uid !== uid) return res.status(403).json({ error: "UID mismatch." });
    if (!/^\d{6}$/.test(String(code || ""))) {
      return res.status(400).json({ error: "Invalid code format." });
    }

    const ref = db.collection("loginOtps").doc(uid);
    const snap = await ref.get();
    if (!snap.exists) return res.status(400).json({ error: "No code found. Please resend." });

    const data = snap.data();
    const now = Date.now();

    if (!data?.expiresAt || now > data.expiresAt) {
      await ref.delete().catch(() => {});
      return res.status(400).json({ error: "Code expired. Please resend." });
    }

    const attempts = Number(data.attempts || 0);
    if (attempts >= 8) {
      await ref.delete().catch(() => {});
      return res.status(429).json({ error: "Too many attempts. Please resend." });
    }

    const candidateHash = hashOtp(uid, String(code));
    if (candidateHash !== data.otpHash) {
      await ref.set({ attempts: attempts + 1 }, { merge: true });
      return res.status(400).json({ error: "Invalid or expired code." });
    }

    await ref.delete().catch(() => {});
    return res.json({ ok: true });
  } catch (e) {
    console.error("❌ /api/verify-login-code error:", e?.message || e);
    if (e?.stack) console.error(e.stack);
    return res.status(400).json({ error: e?.message || "Verification failed." });
  }
});

app.post("/api/send-registration-otp", async (req, res) => {
  try {
    const { uid, email, token } = req.body || {};
    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.ip;

    console.log("📩 /api/send-registration-otp body:", {
      uid,
      email,
      hasToken: !!token,
    });

    const decoded = await verifyTokenOrThrow(token);

    console.log("✅ decoded token:", {
      uid: decoded?.uid,
      email: decoded?.email,
    });

    if (decoded.uid !== uid) {
      return res.status(403).json({ error: "UID mismatch." });
    }

    if ((decoded.email || "").toLowerCase() !== (email || "").toLowerCase()) {
      return res.status(403).json({ error: "Email mismatch." });
    }

    const rl1 = rateLimit(`regsend:uid:${uid}`, MAX_SENDS_PER_15MIN, 15 * 60 * 1000);
    if (!rl1.ok) return res.status(429).json({ error: "Too many requests. Try later." });

    const rl2 = rateLimit(`regsend:ip:${ip}`, MAX_SENDS_PER_IP_15MIN, 15 * 60 * 1000);
    if (!rl2.ok) return res.status(429).json({ error: "Too many requests from this IP." });

    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ error: "User profile not found." });
    }

    const userData = userSnap.data() || {};
    if (userData.registrationOtpVerified) {
      return res.status(400).json({ error: "Registration OTP already verified." });
    }

    const ref = db.collection("registrationOtps").doc(uid);
    const snap = await ref.get();
    const data = snap.exists ? snap.data() : null;

    const now = Date.now();
    if (data?.lastSentAt && now - data.lastSentAt < RESEND_COOLDOWN_MS) {
      return res.status(429).json({ error: "Please wait before resending." });
    }

    const otp = generateOtp();
    const otpHash = hashOtp(uid, otp);
    const expiresAt = now + OTP_TTL_MS;

    await ref.set(
      {
        email: (email || "").toLowerCase(),
        otpHash,
        expiresAt,
        lastSentAt: now,
        attempts: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log("📨 Sending registration OTP email to:", email);

    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Your registration verification code",
      text: `Your 6-digit registration code is: ${otp}\n\nThis code expires in 10 minutes. After verifying this OTP, your account will still need admin approval before you can log in.`,
    });

    console.log("✅ Registration OTP email sent successfully to:", email);

    return res.json({ ok: true });
  } catch (e) {
    console.error("❌ /api/send-registration-otp error:", e?.message || e);
    if (e?.stack) console.error(e.stack);
    return res.status(400).json({ error: e?.message || "Failed to send registration OTP." });
  }
});

app.post("/api/verify-registration-otp", async (req, res) => {
  try {
    const { uid, code, token } = req.body || {};
    const decoded = await verifyTokenOrThrow(token);

    if (decoded.uid !== uid) return res.status(403).json({ error: "UID mismatch." });
    if (!/^\d{6}$/.test(String(code || ""))) {
      return res.status(400).json({ error: "Invalid code format." });
    }

    const ref = db.collection("registrationOtps").doc(uid);
    const snap = await ref.get();
    if (!snap.exists) return res.status(400).json({ error: "No code found. Please resend." });

    const data = snap.data();
    const now = Date.now();

    if (!data?.expiresAt || now > data.expiresAt) {
      await ref.delete().catch(() => {});
      return res.status(400).json({ error: "Code expired. Please resend." });
    }

    const attempts = Number(data.attempts || 0);
    if (attempts >= 8) {
      await ref.delete().catch(() => {});
      return res.status(429).json({ error: "Too many attempts. Please resend." });
    }

    const candidateHash = hashOtp(uid, String(code));
    if (candidateHash !== data.otpHash) {
      await ref.set({ attempts: attempts + 1 }, { merge: true });
      return res.status(400).json({ error: "Invalid or expired code." });
    }

    await db.collection("users").doc(uid).set(
      {
        registrationOtpVerified: true,
        registrationOtpVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await ref.delete().catch(() => {});
    return res.json({ ok: true });
  } catch (e) {
    console.error("❌ /api/verify-registration-otp error:", e?.message || e);
    if (e?.stack) console.error(e.stack);
    return res.status(400).json({ error: e?.message || "Registration verification failed." });
  }
});

app.post("/api/admin/update-user-status", async (req, res) => {
  try {
    const { token, uid, status } = req.body || {};
    if (!uid) return res.status(400).json({ error: "Missing uid." });

    const s = String(status || "").toLowerCase();
    if (!["approved", "rejected", "pending"].includes(s)) {
      return res.status(400).json({ error: "Invalid status." });
    }

    const decoded = await verifyTokenOrThrow(token);
    const adminProfile = await requireAdmin(decoded.uid);

    const targetRef = db.collection("users").doc(uid);
    const targetSnap = await targetRef.get();
    const before = targetSnap.exists ? targetSnap.data() : null;

    if (!before) {
      return res.status(404).json({ error: "User not found." });
    }

    const registrationOtpIncomplete = before?.registrationOtpVerified === false;

    if (s === "approved" && registrationOtpIncomplete) {
      return res.status(400).json({
        error: "User cannot be approved until registration OTP is verified.",
      });
    }

    await targetRef.set(
      {
        status: s,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...(s === "approved" ? { approvedAt: admin.firestore.FieldValue.serverTimestamp() } : {}),
        ...(s === "rejected" ? { rejectedAt: admin.firestore.FieldValue.serverTimestamp() } : {}),
      },
      { merge: true }
    );

    const action = s === "approved" ? "approve" : s === "rejected" ? "reject" : "set_pending";

    await writeAuditLog({
      adminUid: decoded.uid,
      adminEmail: decoded.email || adminProfile?.email || "",
      action,
      target: {
        uid,
        email: before?.email || "",
        fullName:
          before?.fullName ||
          `${before?.firstName || ""} ${before?.lastName || ""}`.trim() ||
          "",
        role: before?.role || "",
        beforeStatus: before?.status || "",
        afterStatus: s,
        registrationOtpVerified: !!before?.registrationOtpVerified,
      },
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error("❌ /api/admin/update-user-status error:", e?.message || e);
    if (e?.stack) console.error(e.stack);
    return res.status(400).json({ error: e?.message || "Failed to update status." });
  }
});

app.post("/api/admin/remove-users", async (req, res) => {
  try {
    const { token, uids } = req.body || {};
    if (!Array.isArray(uids) || uids.length === 0) {
      return res.status(400).json({ error: "No users selected." });
    }

    const decoded = await verifyTokenOrThrow(token);
    const adminProfile = await requireAdmin(decoded.uid);

    const results = [];

    for (const uid of uids) {
      if (uid === decoded.uid) {
        results.push({ uid, ok: false, error: "You cannot remove your own admin account." });
        continue;
      }

      const targetRef = db.collection("users").doc(uid);
      const targetSnap = await targetRef.get();
      const data = targetSnap.exists ? targetSnap.data() : null;

      if ((data?.role || "").toLowerCase() === "admin") {
        results.push({ uid, ok: false, error: "You cannot remove another admin account." });
        continue;
      }

      const beforeStatus = (data?.status || "unknown").toLowerCase();

      try {
        await admin.auth().deleteUser(uid);
      } catch (err) {
        console.error("❌ Failed to delete Firebase Auth user:", uid, err?.message || err);
        results.push({
          uid,
          ok: false,
          error: err?.message || "Failed to delete Firebase Auth account.",
        });
        continue;
      }

      try {
        await db.collection("loginOtps").doc(uid).delete().catch(() => {});
        await db.collection("registrationOtps").doc(uid).delete().catch(() => {});
        await targetRef.delete().catch(() => {});

        await writeAuditLog({
          adminUid: decoded.uid,
          adminEmail: decoded.email || adminProfile?.email || "",
          action: "remove",
          target: {
            uid,
            email: data?.email || "",
            fullName:
              data?.fullName ||
              `${data?.firstName || ""} ${data?.lastName || ""}`.trim() ||
              "",
            role: data?.role || "",
            beforeStatus,
            afterStatus: "removed",
            region: data?.region || "",
            address: data?.address || "",
            gender: data?.gender || "",
            registrationOtpVerified: !!data?.registrationOtpVerified,
          },
        });

        results.push({ uid, ok: true });
      } catch (err) {
        console.error("❌ Failed to delete Firestore user data:", uid, err?.message || err);
        results.push({
          uid,
          ok: false,
          error: err?.message || "Firebase Auth deleted, but Firestore cleanup failed.",
        });
      }
    }

    return res.json({ ok: true, results });
  } catch (e) {
    console.error("❌ /api/admin/remove-users error:", e?.message || e);
    if (e?.stack) console.error(e.stack);
    return res.status(400).json({ error: e?.message || "Failed to remove users." });
  }
});

app.get("/api/admin/audit-log", async (req, res) => {
  try {
    const token = req.query.token || "";
    const limit = Math.min(Number(req.query.limit || 80), 200);

    const decoded = await verifyTokenOrThrow(token);
    await requireAdmin(decoded.uid);

    const snap = await db.collection("adminAuditLogs").orderBy("createdAt", "desc").limit(limit).get();

    let logs = snap.docs.map((d) => {
      const data = d.data();
      const createdAtMs = toMillisMaybe(data.createdAt, data.createdAtMs);
      return { id: d.id, ...data, createdAtMs };
    });

    logs = logs.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));

    return res.json({ ok: true, logs });
  } catch (e) {
    console.error("❌ /api/admin/audit-log error:", e?.message || e);
    if (e?.stack) console.error(e.stack);
    return res.status(400).json({ error: e?.message || "Failed to load audit logs." });
  }
});

const clientDist = path.join(__dirname, "dist");
app.use(express.static(clientDist));

app.get("*", (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

startInboundEmailPolling();

const PORT = Number(process.env.PORT || 5000);
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));