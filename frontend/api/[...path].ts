export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const backend = "http://13.212.93.139:8000";

  const path = Array.isArray(req.query.path) ? req.query.path.join("/") : "";
  const url = `${backend}/${path}`;

  const upstream = await fetch(url, {
    method: req.method,
    headers: {
      "Content-Type": req.headers["content-type"] || "application/json",
    },
    body:
      req.method !== "GET" && req.method !== "HEAD"
        ? typeof req.body === "string"
          ? req.body
          : JSON.stringify(req.body ?? {})
        : undefined,
  });

  const text = await upstream.text();
  res.status(upstream.status).send(text);
}
