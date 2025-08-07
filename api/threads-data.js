export default async function handler(req, res) {
  // Enable CORS for Chrome extensions and all origins
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "false");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).json({ message: "CORS preflight successful" });
  }

  // Add debug info for testing
  console.log("Request method:", req.method);
  console.log("Request URL:", req.url);
  console.log("Query params:", req.query);

  // Test endpoint - return success if no URL provided (for testing)
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

    console.log("Fetch response status:", response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log("HTML length received:", html.length);

    // Extract data using regex (since cheerio isn't available in edge runtime)
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

    console.log("Extracted data:", { ogTitle, ogDescription, ogImage });

    // Parse username
    const usernameMatch = ogTitle.match(/@([\w.\-]+)/);
    const username = usernameMatch ? `@${usernameMatch[1]}` : "Unknown User";

    const postData = {
      username,
      postText: ogDescription || "Could not retrieve post text.",
      avatarUrl: ogImage || "",
      success: true,
      debug: {
        htmlLength: html.length,
        foundTitle: !!ogTitle,
        foundDescription: !!ogDescription,
        foundImage: !!ogImage,
      },
    };

    console.log("Returning post data:", postData);
    res.json(postData);
  } catch (error) {
    console.error("Error in threads-data API:", error);
    res.status(500).json({
      error: "Failed to fetch post data",
      message: error.message,
      success: false,
      debug: {
        error: error.name,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
    });
  }
}
