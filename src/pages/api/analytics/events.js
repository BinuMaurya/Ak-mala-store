// src/pages/api/analytics/events.js
export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  // यहाँ आपका analytics लॉजिक (यदि नहीं है तो खाली OK)
  res.status(200).json({ ok: true });
}
