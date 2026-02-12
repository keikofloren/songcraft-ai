export default async function handler(req: any, res: any) {
  const backend = "http://13.212.93.139:8000";

  const path = req.query.path?.join("/") || "";
  const url = `${backend}/${path}`;

  const response = await fetch(url, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
    },
    body:
      req.method !== "GET" && req.method !== "HEAD"
        ? JSON.stringify(req.body)
        : undefined,
  });

  const data = await response.text();
  res.status(response.status).send(data);
}
