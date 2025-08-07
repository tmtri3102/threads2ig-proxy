// api/threads-data.js
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (!req.query.url) {
    return res.status(200).json({
      message: "Threads2IG API is working!",
      timestamp: new Date().toISOString(),
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

    console.log("Fetching URL:", url);
    const response = await fetch(url, { timeout: 3000 }).catch((err) => {
      console.error("Fetch failed:", err.message);
      return null;
    });

    if (!response || !response.ok) {
      console.error(
        "Fetch failed or not OK:",
        response?.status,
        response?.statusText
      );
      return res.status(200).json({
        username: "Unknown User",
        postText: "Could not retrieve post text.",
        avatarUrl: "",
        success: false,
        message: "Fetch failed, using fallback.",
      });
    }

    const html = await response.text();
    console.log("HTML length:", html.length);

    const extractMetaContent = (property) => {
      try {
        const regex = new RegExp(
          `<meta\\s+property=["']${property}["'][^>]*content=["']([^"']*)["'][^>]*>`,
          "i"
        );
        const match = html.match(regex);
        return match ? match[1].trim() : "";
      } catch (e) {
        console.error(`Meta extraction failed for ${property}:`, e.message);
        return "";
      }
    };

    const ogTitle = extractMetaContent("og:title");
    const ogDescription = extractMetaContent("og:description");
    const ogImage = extractMetaContent("og:image");

    console.log("Meta tags:", { ogTitle, ogDescription, ogImage });

    const usernameMatch = ogTitle.match(/@([\w.\-]+)/) || [];
    const username = usernameMatch[1] ? `@${usernameMatch[1]}` : "Unknown User";

    res.status(200).json({
      username,
      postText: ogDescription || "Could not retrieve post text.",
      avatarUrl: ogImage || "",
      success: true,
    });
  } catch (error) {
    console.error("API error:", error.message);
    res.status(200).json({
      // Changed to 200 to avoid crash reporting
      error: "Failed to process data",
      message: error.message,
      success: false,
      username: "Unknown User",
      postText: "Could not retrieve post text.",
      avatarUrl: "",
    });
  }
}
