// POST-only relay: checks the secret code, then forwards every other
// argument (JSON/form body fields + query params) to the Discord webhook.
//
// Required Vercel environment variables:
//   SECRET_CODE          - the code callers must send
//   DISCORD_WEBHOOK_URL  - the Discord webhook to forward to

const crypto = require("crypto");

const DISCORD_LIMIT = 2000;
const SECRET_KEYS = ["secret", "code", "secret_code", "secretCode"];

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

async function readBody(req) {
  // Vercel already parses JSON / urlencoded / text bodies into req.body.
  if (req.body !== undefined && req.body !== null && req.body !== "") {
    if (typeof req.body === "string") {
      try {
        return JSON.parse(req.body);
      } catch {
        return { body: req.body };
      }
    }
    if (Buffer.isBuffer(req.body)) return { body: req.body.toString("utf8") };
    return req.body;
  }
  return {};
}

function pickSecret(req, body, query) {
  const header = req.headers["x-secret"] || req.headers["x-secret-code"];
  if (header) return header;
  const auth = req.headers["authorization"];
  if (auth && auth.startsWith("Bearer ")) return auth.slice(7);
  for (const k of SECRET_KEYS) {
    if (body && typeof body === "object" && body[k] !== undefined) return body[k];
    if (query[k] !== undefined) return query[k];
  }
  return undefined;
}

function stripSecret(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const out = { ...obj };
  for (const k of SECRET_KEYS) delete out[k];
  return out;
}

async function sendToDiscord(url, data) {
  // If the caller sent Discord-native fields, pass them straight through.
  if (data && typeof data === "object" && (data.content || data.embeds)) {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  const text = JSON.stringify(data, null, 2);
  const block = "```json\n" + text + "\n```";

  if (block.length <= DISCORD_LIMIT) {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: block }),
    });
  }

  // Too long for a message: send it as a file attachment.
  const form = new FormData();
  form.append("payload_json", JSON.stringify({ content: "Payload attached:" }));
  form.append("files[0]", new Blob([text], { type: "application/json" }), "payload.json");
  return fetch(url, { method: "POST", body: form });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const expected = process.env.SECRET_CODE;
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!expected || !webhook) {
    return res.status(500).json({ ok: false, error: "Server not configured" });
  }

  const query = { ...(req.query || {}) };
  const body = await readBody(req);
  const provided = pickSecret(req, body, query);

  if (provided === undefined || !safeEqual(provided, expected)) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const cleanBody = stripSecret(body);
  const cleanQuery = stripSecret(query);
  let payload;
  if (Object.keys(cleanQuery).length === 0) payload = cleanBody;
  else if (cleanBody && typeof cleanBody === "object" && !Array.isArray(cleanBody))
    payload = { ...cleanQuery, ...cleanBody };
  else payload = { ...cleanQuery, body: cleanBody };

  if (payload === undefined || (typeof payload === "object" && Object.keys(payload).length === 0)) {
    return res.status(400).json({ ok: false, error: "Nothing to send" });
  }

  try {
    const r = await sendToDiscord(webhook, payload);
    if (!r.ok) {
      const detail = await r.text();
      return res.status(502).json({ ok: false, error: "Discord rejected the message", status: r.status, detail });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(502).json({ ok: false, error: "Could not reach Discord" });
  }
};
