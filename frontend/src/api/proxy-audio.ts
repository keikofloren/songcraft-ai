

export default async function handler(req: any, res: any) {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Missing url param" });

    // Forward browser Range header to backend
    const range = req.headers.range as string | undefined;

    const backendUrl = `http://13.213.64.109:8000/proxy-audio?url=${encodeURIComponent(
      url
    )}`;

    const response = await fetch(backendUrl, {
      headers: range ? { Range: range } : {},
    });

    // Pass through status (206 matters!)
    res.statusCode = response.status;

    // Pass through important headers
    const contentType = response.headers.get("content-type") || "audio/mpeg";
    res.setHeader("Content-Type", contentType);

    const acceptRanges = response.headers.get("accept-ranges");
    if (acceptRanges) res.setHeader("Accept-Ranges", acceptRanges);

    const contentRange = response.headers.get("content-range");
    if (contentRange) res.setHeader("Content-Range", contentRange);

    const contentLength = response.headers.get("content-length");
    if (contentLength) res.setHeader("Content-Length", contentLength);

    // Optional but nice
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (!response.ok && response.status !== 206) {
      // Let errors pass through
      return res.end();
    }

    // Stream response body instead of buffering entire file
    // Node 18+ fetch gives a web ReadableStream; convert to Node stream
    const { Readable } = await import("stream");
    const nodeStream = Readable.fromWeb(response.body as any);
    nodeStream.pipe(res);
  } catch (err) {
    console.error("proxy-audio error:", err);
    res.status(500).json({ error: "Proxy failed" });
  }
}
