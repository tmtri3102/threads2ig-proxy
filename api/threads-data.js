// api/threads-data.js
export default async function handler(req, res) {
  // Set CORS headers for all responses
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400"); // Cache preflight for 24 hours

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Test endpoint
  if (!req.query.url) {
    return res.status(200).json({
      message: "Threads2IG API is working!",
      timestamp: new Date().toISOString(),
      method: req.method,
      success: true,
    });
  }

  try {
    const { url } = req.query;
    if (!url.includes("threads.com")) {
      return res
        .status(400)
        .json({ error: "Invalid Threads URL", success: false });
    }

    console.log("Fetching Threads URL:", url);

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const extractMetaContent = (property) => {
      const regex = new RegExp(
        `<meta\\s+property=["']${property}["']\\s+content=["']([^"']+)["']`,
        "i"
      );
      const match = html.match(regex);
      return match ? match[1] : "";
    };

    const ogTitle = extractMetaContent("og:title");
    const ogDescription = extractMetaContent("og:description");
    const ogImage = extractMetaContent("og:image");
    const usernameMatch = ogTitle.match(/@([\w.\-]+)/);
    const username = usernameMatch ? `@${usernameMatch[1]}` : "Unknown User";

    res.status(200).json({
      username,
      postText: ogDescription || "Could not retrieve post text.",
      avatarUrl: ogImage || "",
      success: true,
    });
  } catch (error) {
    console.error("Error in threads-data API:", error);
    res.status(500).json({
      error: "Failed to fetch post data",
      message: error.message,
      success: false,
    });
  }
}
