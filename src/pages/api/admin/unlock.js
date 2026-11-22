// src/pages/api/admin/unlock.js
export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  // admin‑unlock लॉजिक (या सिर्फ़ OK)
  res.status(200).json({ unlocked: true });
}
