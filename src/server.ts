// src/server.ts
import express from "express";
import compression from "compression";
import { createServer as createViteServer } from "vite";
import path from "path";

const isProd = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT) || 3000;
const app = express();

app.use(compression());

if (!isProd) {
  (async () => {
    const vite = await createViteServer({
      server: { middlewareMode: "ssr" },
    });
    // Vite की dev‑middleware जोड़ते हैं
    app.use(vite.middlewares);
    // API फ़ाइलें (src/pages/api/*.js) स्वाभाविक रूप से काम कर जाएँगी
    app.listen(port, () =>
      console.log(`🚀 dev server listening on http://localhost:${port}`)
    );
  })();
} else {
  // प्रोडक्शन बिल्ड के लिए
  const dist = path.resolve(__dirname, "../dist");
  app.use(express.static(dist));
  app.get("*", (req, res) => res.sendFile(path.join(dist, "index.html")));
  app.listen(port, () =>
    console.log(`🚀 prod server listening on http://localhost:${port}`)
  );
}
