export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { url } = req.query;

    if (!url || !url.includes("threads.com")) {
      return res.status(400).json({ error: "Invalid Threads URL" });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const html = await response.text();

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

    // Parse username
    const usernameMatch = ogTitle.match(/@([\w.\-]+)/);
    const username = usernameMatch ? `@${usernameMatch[1]}` : "Unknown User";

    const postData = {
      username,
      postText: ogDescription || "Could not retrieve post text.",
      avatarUrl: ogImage || "",
      success: true,
    };

    res.json(postData);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      error: "Failed to fetch post data",
      success: false,
    });
  }
}
