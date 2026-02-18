export default async function handler(req: any, res: any) {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "Missing url param" });
    }

    // Call EC2 backend
    const backendUrl = `http://13.213.64.109:8000/proxy-audio?url=${encodeURIComponent(
      url
    )}`;

    const response = await fetch(backendUrl);

    if (!response.ok) {
      return res.status(response.status).end();
    }

    // Copy content-type so browser knows it's audio
    res.setHeader(
      "Content-Type",
      response.headers.get("content-type") || "audio/mpeg"
    );

    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    console.error("proxy-audio error:", err);
    res.status(500).json({ error: "Proxy failed" });
  }
}
