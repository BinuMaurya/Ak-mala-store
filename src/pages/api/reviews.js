// src/pages/api/reviews.js
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  // Placeholder reviews – replace with real data source as needed
  const reviews = [
    {
      id: 1,
      author: "Happy Customer",
      rating: 5,
      comment: "Beautiful mala, great service!",
    },
    // add more review objects as needed
  ];
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");
  res.status(200).json(reviews);
}
