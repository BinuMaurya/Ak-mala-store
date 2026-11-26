// src/pages/api/store.js
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  // Placeholder store data – replace with real data source as needed
  const storeData = {
    products: [],
    banners: [],
    collections: [],
    // add any other fields your front‑end expects
  };
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");
  res.status(200).json(storeData);
}
