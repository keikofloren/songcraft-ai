

export default async function handler(req: any, res: any) {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Missing url param" });

    // Forward browser Range header to backend
    const range = req.headers.range as string | undefined;

    const headers: Record<string, string> = {
    "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
    "Accept": "*/*",
    "Accept-Encoding": "identity",
    // Referer helps with hotlink protection sometimes
    "Referer": req.headers.referer || "https://songcraft-ai.vercel.app",
    };

    if (range) headers["Range"] = range;

    const response = await fetch(url, { headers, redirect: "follow" });

    // Pass through status (206 matters!)
    res.statusCode = response.status;

    // Pass through important headers
    const contentType = response.headers.get("content-type") || "audio/mpeg";
    res.setHeader("Content-Type", contentType);

    // If upstream blocked us, it'll often return HTML
    if (contentType.includes("text/html")) {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Upstream returned HTML (blocked/hotlink-protected)" }));
    return;
    }

    const acceptRanges = response.headers.get("accept-ranges");
    if (acceptRanges) res.setHeader("Accept-Ranges", acceptRanges);

    const contentRange = response.headers.get("content-range");
    if (contentRange) res.setHeader("Content-Range", contentRange);

    const contentLength = response.headers.get("content-length");
    if (contentLength) res.setHeader("Content-Length", contentLength);

    if (!response.ok && response.status !== 206) {
      // Let errors pass through
      return res.end();
    }

    if (!response.body) {
        const buf = Buffer.from(await response.arrayBuffer());
        res.end(buf);
        return;
    }

    const { Readable } = await import("stream");
    Readable.fromWeb(response.body as any).pipe(res);

  } catch (err) {
    console.error("proxy-audio error:", err);
    res.status(500).json({ error: "Proxy failed" });
  }
}
