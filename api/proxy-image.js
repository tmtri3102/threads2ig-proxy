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

  // Test endpoint
  if (!req.query.url) {
    return res.status(200).json({
      message: "Image proxy API is working!",
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const { url } = req.query;
    console.log("Proxying image URL:", url);

    const imageResponse = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        Referer: "https://www.threads.net/",
      },
    });

    console.log("Image fetch status:", imageResponse.status);

    if (!imageResponse.ok) {
      throw new Error(
        `Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType =
      imageResponse.headers.get("content-type") || "image/jpeg";

    console.log(
      "Image proxied successfully, size:",
      imageBuffer.byteLength,
      "type:",
      contentType
    );

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("Content-Length", imageBuffer.byteLength);
    res.send(Buffer.from(imageBuffer));
  } catch (error) {
    console.error("Error proxying image:", error);
    res.status(500).json({
      error: "Failed to proxy image",
      message: error.message,
      debug: {
        requestUrl: req.query.url,
        error: error.name,
      },
    });
  }
}
