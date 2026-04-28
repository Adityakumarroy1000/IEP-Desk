const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";

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

  const res = await fetch(`${BASE_URL}/api${url}`, options);
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = payload?.message || "Request failed";
    throw new Error(message);
  }
  return payload;
}

export const api = {
  request,
  get: (url, token, config) => request("get", url, null, token, config),
  post: (url, data, token, config) => request("post", url, data, token, config),
  put: (url, data, token, config) => request("put", url, data, token, config),
  del: (url, token, config) => request("delete", url, null, token, config)
};
