// Create this new file in the api folder: api/proxy-image.js
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (!req.query.url) {
    return res.status(400).json({ error: "No URL provided" });
  }

  try {
    const response = await fetch(req.query.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124",
      },
      timeout: 3000,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    res.setHeader("Content-Type", "image/jpeg"); // Adjust based on avatar type if needed
    res.status(200).send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error("Proxy image error:", error.message);
    res.status(500).json({ error: "Failed to proxy image" });
  }
}
