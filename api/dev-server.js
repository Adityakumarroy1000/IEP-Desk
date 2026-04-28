import http from "node:http";

// Node 20+ built-in .env loader.
if (typeof process.loadEnvFile === "function") {
  process.loadEnvFile(".env");
}

// Defensively normalize BOM-prefixed env keys (common on Windows-edited .env files).
for (const key of Object.keys(process.env)) {
  const normalizedKey = key.replace(/^\uFEFF+/, "");
  if (normalizedKey !== key && !process.env[normalizedKey]) {
    process.env[normalizedKey] = process.env[key];
  }
}

const { default: handler } = await import("./server.js");
const port = Number(process.env.API_PORT || 3000);

const server = http.createServer((req, res) => {
  const url = req.url || "/";

  if (url === "/" && req.method === "GET") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ status: "IEP Desk local serverless API" }));
    return;
  }

  if (url.startsWith("/api")) {
    handler(req, res);
    return;
  }

  res.statusCode = 404;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ message: "Not found" }));
});

server.listen(port, () => {
  console.log(`Serverless API dev server listening on http://localhost:${port}`);
});
