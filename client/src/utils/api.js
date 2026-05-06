const rawApiBase = import.meta.env.VITE_API_URL;
const BASE_URL = typeof rawApiBase === "string" ? rawApiBase.trim() : "";
const inflightGetRequests = new Map();

function joinUrl(base, path) {
  const basePart = String(base || "").replace(/\/+$/, "");
  const pathPart = String(path || "").replace(/^\/+/, "");
  return basePart ? `${basePart}/${pathPart}` : `/${pathPart}`;
}

async function request(method, url, data, token, config = {}) {
  const defaultHeaders = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const options = {
    method: method.toUpperCase(),
    ...config
  };
  options.headers = { ...defaultHeaders, ...(config.headers || {}) };

  if (data && !(data instanceof FormData)) {
    options.body = JSON.stringify(data);
  }

  if (data instanceof FormData) {
    options.body = data;
    delete options.headers["Content-Type"];
  }

  const requestUrl = joinUrl(BASE_URL, `api${url}`);
  const methodName = method.toUpperCase();
  const canDedupeGet = methodName === "GET" && !data;
  const requestKey = canDedupeGet ? `${requestUrl}|${token || ""}` : null;

  if (requestKey && inflightGetRequests.has(requestKey)) {
    return inflightGetRequests.get(requestKey);
  }

  const execute = async () => {
  let res;
  try {
    res = await fetch(requestUrl, options);
  } catch (error) {
    const isLocalApi = requestUrl.includes("localhost:3000");
    const message = isLocalApi
      ? "Cannot reach local API server at http://localhost:3000. Start it with `npm run dev:api`."
      : "Cannot reach the API right now. Please check your network or server status and try again.";
    throw new Error(message);
  }
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = payload?.message || "Request failed";
    throw new Error(message);
  }
  return payload;
  };

  if (requestKey) {
    const promise = execute().finally(() => {
      inflightGetRequests.delete(requestKey);
    });
    inflightGetRequests.set(requestKey, promise);
    return promise;
  }

  return execute();
}

export const api = {
  request,
  get: (url, token, config) => request("get", url, null, token, config),
  post: (url, data, token, config) => request("post", url, data, token, config),
  put: (url, data, token, config) => request("put", url, data, token, config),
  del: (url, token, config) => request("delete", url, null, token, config)
};
